import { defaultLayerMask } from "../Utils/LayerMasks";
import { AsyncStaticMeshInstanceRunner } from "@engine/AsyncAssets";
import { Material } from "@babylonjs/core";
import { GetPreviouslyLoadedAWSAsset } from "@engine/AsyncAssets/Framework/AsyncAssetLoader";
import { decode } from "@msgpack/msgpack";
import { GetMaterialDescription } from "@BabylonBurstClient/Materials/EngineMaterialDescriptions";
import { GameEcosystem } from "@engine/GameEcosystem";
import { HiddenEntity, InstancedRender } from "@engine/Rendering/InstancedRender";
import { EntTransform } from "@engine/EntitySystem/CoreComponents";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { AsyncArrayBufferLoader } from "@engine/Utils/StandardAsyncLoaders";
import { GameSystem, GameSystemRunType } from "@engine/GameLoop/GameSystem";
import { InstancedRenderSystemPriority } from "@engine/GameLoop/GameSystemPriorities";
import { MaterialSpecifier } from "@engine/Rendering/MaterialSpecifier";

export function RefreshWireframeMode(ecosystem: GameEcosystem) {
    if (!ecosystem.dynamicProperties.LoadedRunners) {
        return;
    }
    const allRunners = Object.keys(ecosystem.dynamicProperties.LoadedRunners);
    allRunners.forEach(r => {
        const runner = ecosystem.dynamicProperties.LoadedRunners[r] as AsyncStaticMeshInstanceRunner;
        const finalMesh = runner.GetFinalMesh(ecosystem.scene);
        if (finalMesh) {
            finalMesh.material.wireframe = ecosystem.dynamicProperties["___MATERIALWIREFRAMEMODE___"];
        }
    });
}

export class InstancedMeshRenderSystem extends GameSystem {
    SystemOrdering = InstancedRenderSystemPriority;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {}

    RunSystem(ecosystem: GameEcosystem) {
        const allInstEntities = ecosystem.entitySystem.GetEntitiesWithData(
            [InstancedRender, EntTransform],
            [HiddenEntity],
        );
        var thisFrameTransformData: { [id: string]: number[] } = {};

        if (ecosystem.dynamicProperties.LoadedRunners === undefined) {
            ecosystem.dynamicProperties.LoadedRunners = {};
        }

        //Perform setup for data
        allInstEntities.iterateEntities((entData: EntityData) => {
            const rendItem = entData.GetComponent<InstancedRender>(InstancedRender);
            const runnerID = this.GetRunnerID(rendItem, entData);
            //Create render runner if not exists
            if (ecosystem.dynamicProperties.LoadedRunners[runnerID] === undefined) {
                const mats = this.GetMaterials(rendItem, entData, ecosystem);
                //Materials not ready yet?
                if (mats.length === 0 && rendItem.MaterialData.length > 0) {
                    return;
                }
                ecosystem.dynamicProperties.LoadedRunners[runnerID] = new AsyncStaticMeshInstanceRunner(
                    rendItem.ModelData.FilePath,
                    rendItem.ModelData.MeshName,
                    mats,
                    rendItem.ModelData.FileName,
                    this.GetLayerMask(rendItem, entData),
                );
            }
            //Set our data for this frame
            if (thisFrameTransformData[runnerID] === undefined) {
                thisFrameTransformData[runnerID] = [];
            }
            const transform = entData.GetComponent<EntTransform>(EntTransform);
            thisFrameTransformData[runnerID] = thisFrameTransformData[runnerID].concat(
                EntTransform.getAsInstanceArray(transform),
            );
        });

        //Run instances
        const keys = Object.keys(ecosystem.dynamicProperties.LoadedRunners);
        keys.forEach(key => {
            const data = thisFrameTransformData[key];
            const floatData = data === undefined ? new Float32Array() : new Float32Array(data);
            ecosystem.dynamicProperties.LoadedRunners[key].RunTransformSystem(ecosystem.scene, floatData);
        });
    }

    /** Get layermask to render with for a instanced render */
    GetLayerMask(val: InstancedRender, entData: EntityData): number {
        if (val.LayerMask === 0) {
            return defaultLayerMask;
        }
        return val.LayerMask;
    }

    /** Gets a unique ID for this combination of materials */
    GetRunnerID(rend: InstancedRender, ent: EntityData): string {
        var ret: string = rend.ModelData.FilePath + "_" + rend.ModelData.MeshName + "_" + 0 + "_";
        ret += rend.LayerMask;
        ret += "_MATS_";
        for (var m = 0; m < rend.MaterialData.length; m++) {
            ret += "_" + rend.MaterialData[m].FileName + "_" + rend.MaterialData[m].FilePath;
        }
        return ret;
    }

    /** Get the materials for a particular instanced render type */
    GetMaterials(instancedRend: InstancedRender, ent: EntityData, ecosystem: GameEcosystem): Material[] {
        const ret: Material[] = [];
        for (var m = 0; m < instancedRend.MaterialData.length; m++) {
            const spec = instancedRend.MaterialData[m];
            if (spec.FilePath === undefined || spec.FileName === undefined) {
                console.warn("Null fallback for material: " + spec.FilePath + " " + spec.FileName);
                ret.push(null);
                continue;
            }
            //Load material identifier from async
            var matLoader = GetPreviouslyLoadedAWSAsset(spec.FilePath, spec.FileName) as AsyncArrayBufferLoader;
            if (!matLoader) {
                matLoader = new AsyncArrayBufferLoader(spec.FilePath, spec.FileName);
                return [];
            }
            if (!matLoader.AssetFullyLoaded) {
                return [];
            }
            if (!matLoader.rawData) {
                console.warn("Null fallback for material: " + spec.FilePath + " " + spec.FileName);
                ret.push(null);
                continue;
            }
            //Try get material
            const data = decode(matLoader.rawData) as any;
            if (!data.MaterialShaderType) {
                ret.push(null);
                console.warn("Null fallback for material: " + spec.FilePath + " " + spec.FileName);
                continue;
            }

            //No shader found?
            const shader = GetMaterialDescription(data.MaterialShaderType);
            if (!shader) {
                console.warn("Null fallback for material: " + spec.FilePath + " " + spec.FileName);
                ret.push(null);
                continue;
            }

            //Full success
            const mat = shader.LoadMaterial(data, ecosystem.scene);
            ret.push(mat);
        }
        return ret;
    }
}
