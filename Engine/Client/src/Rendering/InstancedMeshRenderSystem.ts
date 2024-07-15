import { defaultLayerMask } from "../Utils/LayerMasks";
import {
    AsyncStaticMeshInstanceRunner,
    GetAsyncSceneIdentifier,
    InstancedMeshTransform,
} from "@BabylonBurstCore/AsyncAssets";
import { Material, Mesh, PickingInfo, Scene } from "@babylonjs/core";
import { GetPreviouslyLoadedAWSAsset } from "@BabylonBurstCore/AsyncAssets/Framework/AsyncAssetLoader";
import { decode } from "@msgpack/msgpack";
import { GetMaterialDescription } from "@BabylonBurstClient/Materials/EngineMaterialDescriptions";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { HiddenEntity, InstancedRender } from "@BabylonBurstCore/Rendering/InstancedRender";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { EntityData } from "@BabylonBurstCore/EntitySystem/EntityData";
import { AsyncArrayBufferLoader } from "@BabylonBurstCore/Utils/StandardAsyncLoaders";
import { GameSystem, GameSystemRunType } from "@BabylonBurstCore/GameLoop/GameSystem";
import { InstancedRenderSystemPriority } from "@BabylonBurstCore/GameLoop/GameSystemPriorities";
import { EntityQuery } from "@BabylonBurstCore/EntitySystem/EntityQuery";

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

type instancedMeshData = {
    transformData: InstancedMeshTransform[];
    entityData: number[];
};

class InstancedMesh extends Mesh {
    /** For each instance what is the entity for that inst */
    entityData: number[];
}

export class InstancedMeshRenderSystem extends GameSystem {
    SystemOrdering = InstancedRenderSystemPriority;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {
        if (ecosystem.dynamicProperties[InstancedMeshRenderSystem.priorLoadedMaterialsArray] === undefined) {
            ecosystem.dynamicProperties[InstancedMeshRenderSystem.priorLoadedMaterialsArray] = [];
        }
    }

    RunSystem(ecosystem: GameEcosystem) {
        var thisFrameTransformData: { [id: string]: instancedMeshData } = {};

        const allInstEntities = this.GetRenderEntities(ecosystem);

        if (ecosystem.dynamicProperties.LoadedRunners === undefined) {
            ecosystem.dynamicProperties.LoadedRunners = {};
        }

        //Perform setup for data
        allInstEntities.iterateEntities((entData: EntityData) => {
            const rendItem = this.GetInstancedRender(entData);
            const runnerID = this.GetRunnerID(rendItem, this.GetScene(ecosystem));
            //Create render runner if not exists
            if (ecosystem.dynamicProperties.LoadedRunners[runnerID] === undefined) {
                const mats = this.GetMaterials(rendItem, entData, ecosystem);
                //Materials not ready yet?
                if (mats.length === 0 && rendItem.MaterialData.length > 0) {
                    return;
                }

                ecosystem.dynamicProperties.LoadedRunners[runnerID] = this.GetAsyncStaticMeshInstanceRunner(
                    rendItem.ModelData.FilePath,
                    rendItem.ModelData.FileName,
                    rendItem.ModelData.MeshName,
                    mats,
                    this.GetLayerMask(rendItem, entData),
                    ecosystem,
                );
            }
            //Set our data for this frame
            if (thisFrameTransformData[runnerID] === undefined) {
                thisFrameTransformData[runnerID] = { transformData: [], entityData: [] };
            }
            const transform = entData.GetComponent<EntTransform>(EntTransform);
            thisFrameTransformData[runnerID].transformData.push(EntTransform.getAsInstanceTransform(transform));
            thisFrameTransformData[runnerID].entityData.push(entData.EntityId);
        });

        const rendVariant = this.constructor.name;
        //Run instances
        const keys = Object.keys(ecosystem.dynamicProperties.LoadedRunners);
        keys.forEach(key => {
            if (!key.endsWith(rendVariant)) {
                return;
            }
            const transformSystem = ecosystem.dynamicProperties.LoadedRunners[key] as AsyncStaticMeshInstanceRunner;
            const data = thisFrameTransformData[key];
            transformSystem.RunTransformSystem(
                this.GetScene(ecosystem),
                data === undefined ? [] : data.transformData,
                allInstEntities,
            );
            const finalM = transformSystem.GetFinalMesh(ecosystem.scene) as InstancedMesh;
            if (finalM) {
                finalM.isPickable = true;
                finalM.thinInstanceEnablePicking = true;
                finalM.entityData = data === undefined ? [] : data.entityData;
            }
        });
    }

    /** Setup the AsyncStaticMeshInstanceRunner for our use */
    GetAsyncStaticMeshInstanceRunner(
        filePath: string,
        fileName: string,
        meshName: string,
        mats: Material[],
        layerMask: number,
        ecosystem: GameEcosystem,
    ): AsyncStaticMeshInstanceRunner {
        return new AsyncStaticMeshInstanceRunner(filePath, meshName, mats, fileName, layerMask);
    }

    /** Get layermask to render with for a instanced render */
    GetLayerMask(val: InstancedRender, entData: EntityData): number {
        if (val.LayerMask === 0) {
            return defaultLayerMask;
        }
        return val.LayerMask;
    }

    /** Gets a unique ID for this combination of materials */
    GetRunnerID(rend: InstancedRender, scene: Scene): string {
        var ret: string = rend.ModelData.FilePath + "_" + rend.ModelData.MeshName + "_" + 0 + "_";
        ret += rend.LayerMask;
        ret += "_MATS_";
        for (var m = 0; m < rend.MaterialData.length; m++) {
            ret += "_" + rend.MaterialData[m].FileName + "_" + rend.MaterialData[m].FilePath;
        }
        ret += "_" + GetAsyncSceneIdentifier(scene);
        ret += "_" + this.constructor.name;
        return ret;
    }

    /** Useful if we want to render in different scenes (eg a minimap specific scene) */
    GetScene(ecosystem: GameEcosystem) {
        return ecosystem.scene;
    }

    /** Useful if we want to render from child comps etc (eg a minimap specific scene) */
    GetInstancedRender(entity: EntityData) {
        return entity.GetComponent(InstancedRender);
    }

    /** Useful if we want to get specific entities for a specific version of instance render */
    GetRenderEntities(ecosystem: GameEcosystem): EntityQuery {
        return ecosystem.entitySystem.GetEntitiesWithData([InstancedRender, EntTransform], [HiddenEntity]);
    }

    static priorLoadedMaterialsArray = "___INSTANCERENDERPRIORLOADEDMATS___";

    /** Get the materials for a particular instanced render type */
    GetMaterials(instancedRend: InstancedRender, ent: EntityData, ecosystem: GameEcosystem): Material[] {
        const ret: Material[] = [];
        const sceneID = GetAsyncSceneIdentifier(this.GetScene(ecosystem));

        for (var m = 0; m < instancedRend.MaterialData.length; m++) {
            const spec = instancedRend.MaterialData[m];
            if (spec.FilePath === undefined || spec.FileName === undefined) {
                console.warn("Null fallback for material: " + spec.FilePath + " " + spec.FileName);
                ret.push(null);
                continue;
            }

            const matId = spec.FilePath + "_" + spec.FileName + "_" + sceneID;
            //Already loaded?
            if (ecosystem.dynamicProperties[InstancedMeshRenderSystem.priorLoadedMaterialsArray][matId]) {
                ret.push(ecosystem.dynamicProperties[InstancedMeshRenderSystem.priorLoadedMaterialsArray][matId]);
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
            const mat = shader.LoadMaterial(data, this.GetScene(ecosystem));
            ret.push(mat);
            ecosystem.dynamicProperties[InstancedMeshRenderSystem.priorLoadedMaterialsArray][matId] = mat;
        }
        return ret;
    }
}

/** Given a picked mesh try to get the entity that it is tied to */
export function TryGetEntityFromMeshPick(ecosystem: GameEcosystem, pick: PickingInfo): EntityData {
    if (!pick.pickedMesh) return undefined;
    if (pick.thinInstanceIndex === undefined || pick.thinInstanceIndex < 0) return undefined;
    const instm = pick.pickedMesh as InstancedMesh;
    if (!instm.entityData) return undefined;
    return ecosystem.entitySystem.GetEntityData(instm.entityData[pick.thinInstanceIndex]);
}
