import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { GameSystem, GameSystemRunType } from "@BabylonBurstCore/GameLoop/GameSystem";
import { LightingGameSystemPriority } from "@BabylonBurstCore/GameLoop/GameSystemPriorities";
import { DirectionalLightComp } from "@BabylonBurstCore/Rendering/LightingComponents";
import { LightingRebuildTag } from "@BabylonBurstCore/Rendering/LightingComponents";

export class LightingGameSystem extends GameSystem {
    SystemOrdering = LightingGameSystemPriority;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {}

    RunSystem(ecosystem: GameEcosystem) {
        const directLights = ecosystem.entitySystem.GetEntitiesWithData([DirectionalLightComp, LightingRebuildTag], []);
        directLights.iterateEntities(e => {
            const dirLight = e.GetComponent<DirectionalLightComp>(DirectionalLightComp);
            dirLight.rebuildLight(e, ecosystem);
        });
    }
}
