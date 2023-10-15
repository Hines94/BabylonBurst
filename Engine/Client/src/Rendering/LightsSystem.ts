import { DirectionalLight, Vector3 } from "@babylonjs/core";
import { GetAsyncSceneIdentifier } from "@engine/AsyncAssets";
import { EntVector3 } from "@engine/EntitySystem/CoreComponents";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { GameEcosystem } from "@engine/GameEcosystem";

var generatedDirectionLights: { [sceneId: string]: { [ent: string]: DirectionalLight } } = {};

export function RunLightsSystem(ecosystem: GameEcosystem) {
    return;
    const rebuildLights = ecosystem.entitySystem.GetEntitiesWithData([LightRebuildTag], [], false);
    const rebuildEnts = Object.keys(rebuildLights);
    for (var r = 0; r < rebuildEnts.length; r++) {
        const rebuildEnt = parseInt(rebuildEnts[r]);
        const rebuildEntData = rebuildLights[rebuildEnt];
        GenerateDirectionalLight(rebuildEntData, rebuildEnt);
    }

    function GenerateDirectionalLight(rebuildEntData: EntityData, rebuildEnt: number) {
        if (rebuildEntData[DLightComp.name]) {
            if (!generatedDirectionLights[GetAsyncSceneIdentifier(ecosystem.scene)]) {
                generatedDirectionLights[GetAsyncSceneIdentifier(ecosystem.scene)] = {};
            }
            const dirLights = generatedDirectionLights[GetAsyncSceneIdentifier(ecosystem.scene)];
            const directData = rebuildEntData[DLightComp.name] as DLightComp;
            if (!dirLights[rebuildEnt]) {
                dirLights[rebuildEnt] = new DirectionalLight(
                    "Ent" + rebuildEnt + "_DirectLight",
                    EntVector3.GetVector3(directData.Direction),
                    ecosystem.scene
                );
            }
            //TODO: Set other info
            const light = dirLights[rebuildEnt] as DirectionalLight;
            light.position = EntVector3.GetVector3(directData.Position);
            light.direction = EntVector3.GetVector3(directData.Direction);
            ecosystem.wasmWrapper.DelayedRemoveComponent(rebuildEnt, LightRebuildTag.name);
            console.log(light);
        }
    }
}
