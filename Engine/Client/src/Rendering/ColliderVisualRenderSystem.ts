import { AsyncStaticMeshInstanceRunner, InstancedMeshTransform } from "@BabylonBurstCore/AsyncAssets";
import { uiLayerMask } from "../Utils/LayerMasks";
import { Color3, StandardMaterial } from "@babylonjs/core";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { GameSystem, GameSystemRunType } from "@BabylonBurstCore/GameLoop/GameSystem";
import { ColliderRenderSystemPriority } from "@BabylonBurstCore/GameLoop/GameSystemPriorities";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";

const showVisualsProp = "___Collider___";
const colliderMaterial = "___COLLIDERMATERIAL___";
const loadedVisuals = "___LOADEDCOLLIDERMESHES___";

function getRunnerID(rend: PhysicsCollider): string {
    var ret: string = rend.ColliderMesh.FilePath + "_" + rend.ColliderMesh.MeshName + "_" + 0 + "_";
    return ret;
}

export function hideColliderVisualSystem(ecosystem: GameEcosystem) {
    const keys = Object.keys(ecosystem.dynamicProperties[loadedVisuals]);
    keys.forEach(key => {
        ecosystem.dynamicProperties[loadedVisuals][key].RunTransformSystem(ecosystem.scene, new Float32Array());
    });
}

export class ColliderVisualSystem extends GameSystem {
    SystemOrdering = ColliderRenderSystemPriority;
    systemRunType = GameSystemRunType.EditorOnly;

    SetupGameSystem(ecosystem: GameEcosystem) {}

    RunSystem(ecosystem: GameEcosystem) {
        return;
        if (!ecosystem.dynamicProperties[showVisualsProp]) {
            return;
        }

        const allInstEntities = ecosystem.entitySystem.GetEntitiesWithData([PhysicsCollider, EntTransform], []);
        var thisFrameTransformData: { [id: string]: InstancedMeshTransform[] } = {};

        if (!ecosystem.dynamicProperties[loadedVisuals]) {
            ecosystem.dynamicProperties[loadedVisuals] = {};
        }
        if (!ecosystem.dynamicProperties[colliderMaterial]) {
            ecosystem.dynamicProperties[colliderMaterial] = new StandardMaterial("ColliderVisual", ecosystem.scene);
            ecosystem.dynamicProperties[colliderMaterial].wireframe = true;
            ecosystem.dynamicProperties[colliderMaterial].diffuseColor = Color3.Blue();
            ecosystem.dynamicProperties[colliderMaterial].emissiveColor = Color3.Blue();
        }

        //Get data from instances
        const entities = Object.keys(allInstEntities);
        //Perform setup for data
        entities.forEach(ent => {
            const entKey = parseInt(ent);
            const collideItem = GetComponent(allInstEntities[entKey], PhysicsCollider) as any;
            const runnerID = getRunnerID(collideItem);
            //Create render runner if not exists
            if (ecosystem.dynamicProperties[loadedVisuals][runnerID] === undefined) {
                ecosystem.dynamicProperties[loadedVisuals][runnerID] = new AsyncStaticMeshInstanceRunner(
                    collideItem.ColliderMesh.FilePath,
                    collideItem.ColliderMesh.MeshName,
                    [ecosystem.dynamicProperties[colliderMaterial]],
                    collideItem.ColliderMesh.FileName,
                    uiLayerMask,
                );
            }
            //Set our data for this frame
            if (thisFrameTransformData[runnerID] === undefined) {
                thisFrameTransformData[runnerID] = [];
            }
            const transform = entData.GetComponent<EntTransform>(EntTransform);
            thisFrameTransformData[runnerID] = EntTransform.getAsInstanceTransform(transform);
        });

        //Run instances
        const keys = Object.keys(ecosystem.dynamicProperties[loadedVisuals]);
        keys.forEach(key => {
            const data = thisFrameTransformData[key];
            const floatData = data === undefined ? new Float32Array() : new Float32Array(data);
            ecosystem.dynamicProperties[loadedVisuals][key].RunTransformSystem(ecosystem.scene, floatData);
        });
    }
}
