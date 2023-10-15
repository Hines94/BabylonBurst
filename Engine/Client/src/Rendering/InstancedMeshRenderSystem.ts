import { defaultLayerMask } from "../Utils/LayerMasks";
import { AsyncStaticMeshInstanceRunner } from "@engine/AsyncAssets";
import { Material } from "@babylonjs/core";
import { GetPreviouslyLoadedAWSAsset } from "@engine/AsyncAssets/Framework/AsyncAssetLoader";
import { decode } from "@msgpack/msgpack";
import { GetMaterialDescription } from "@BabylonBurstClient/Materials/EngineMaterialDescriptions";
import { GameEcosystem } from "@engine/GameEcosystem";

function getRunnerID(rend: InstancedRender): string {
    var ret: string = rend.ModelData.FilePath + "_" + rend.ModelData.MeshName + "_" + 0 + "_";
    ret += rend.LayerMask;
    ret += "_MATS_";
    for (var m = 0; m < rend.MaterialData.length; m++) {
        ret += "_" + rend.MaterialData[m].FileName + "_" + rend.MaterialData[m].FilePath;
    }
    return ret;
}

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

function GetLayerMask(val: InstancedRender): number {
    if (val.LayerMask === 0) {
        return defaultLayerMask;
    }
    return val.LayerMask;
}

export function RunInstancedMeshRenderSystem(ecosystem: GameEcosystem) {
    return;
    const allInstEntities = ecosystem.entitySystem.GetEntitiesWithData([InstancedRender, EntTransform], [HiddenEntity]);
    var thisFrameTransformData: { [id: string]: number[] } = {};

    if (ecosystem.dynamicProperties.LoadedRunners === undefined) {
        ecosystem.dynamicProperties.LoadedRunners = {};
    }

    //Get data from instances
    const entities = Object.keys(allInstEntities);

    //Perform setup for data
    entities.forEach(ent => {
        const entKey = parseInt(ent);
        const rendItem = GetComponent<InstancedRender>(allInstEntities[entKey], InstancedRender);
        const runnerID = getRunnerID(rendItem);
        //Create render runner if not exists
        if (ecosystem.dynamicProperties.LoadedRunners[runnerID] === undefined) {
            const mats = GetMaterials(rendItem.MaterialData, ecosystem);
            //Materials not ready yet?
            if (mats.length === 0) {
                return;
            }
            ecosystem.dynamicProperties.LoadedRunners[runnerID] = new AsyncStaticMeshInstanceRunner(
                rendItem.ModelData.FilePath,
                rendItem.ModelData.MeshName,
                mats,
                rendItem.ModelData.FileName,
                GetLayerMask(rendItem)
            );
        }
        //Set our data for this frame
        if (thisFrameTransformData[runnerID] === undefined) {
            thisFrameTransformData[runnerID] = [];
        }
        const transform = GetComponent<EntTransform>(allInstEntities[entKey], EntTransform);
        thisFrameTransformData[runnerID] = thisFrameTransformData[runnerID].concat(
            EntTransform.getAsInstanceArray(transform)
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

function GetMaterials(mats: MaterialSpecifier[], ecosystem: GameEcosystem): Material[] {
    const ret: Material[] = [];
    for (var m = 0; m < mats.length; m++) {
        const spec = mats[m];
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
