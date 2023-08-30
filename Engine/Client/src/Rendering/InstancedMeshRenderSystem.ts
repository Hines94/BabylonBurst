import { defaultLayerMask } from "../Utils/LayerMasks";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { GameEcosystem } from "../../../Shared/src/GameEcosystem";
import { GetComponent } from "../EntitySystem/EntityMsgpackConverter";
import { AsyncStaticMeshInstanceRunner } from "../../../Shared/src/AsyncAssets";

function getRunnerID(rend: InstancedRender): string {
    var ret: string = rend.AwsPath + "_" + rend.MeshName + "_" + 0 + "_";
    ret += rend.LayerMask;
    return ret;
}

export class InstancedRender {
    AwsPath: string = "";
    MeshName: string = "";
    LayerMask: number = 0;

    static getLayerMask(val: InstancedRender): number {
        if (val.LayerMask === 0) {
            return defaultLayerMask;
        }
        return val.LayerMask;
    }
}

export function RunInstancedMeshRenderSystem(ecosystem: GameEcosystem) {
    const allInstEntities = ecosystem.wasmWrapper.GetEntitiesWithData([InstancedRender, EntTransform], []);
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
            ecosystem.dynamicProperties.LoadedRunners[runnerID] = new AsyncStaticMeshInstanceRunner(
                rendItem.AwsPath,
                rendItem.MeshName,
                [null],
                0,
                InstancedRender.getLayerMask(rendItem)
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
