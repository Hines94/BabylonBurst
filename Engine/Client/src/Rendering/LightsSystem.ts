import { GameEcosystem } from "@engine/GameEcosystem";
import { GameSystem, GameSystemRunType } from "@engine/GameLoop/GameSystem";
import { LightingGameSystemPriority } from "@engine/GameLoop/GameSystemPriorities";
import { DirectionalLightComp } from "@engine/Rendering/LightingComponents";
import { LightingRebuildTag } from "@engine/Rendering/LightingComponents";

export class LightingGameSystem extends GameSystem {
    SystemOrdering = LightingGameSystemPriority;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {}

    RunSystem(ecosystem: GameEcosystem) {
        const directLights = ecosystem.entitySystem.GetEntitiesWithData([DirectionalLightComp,LightingRebuildTag], []);
        directLights.iterateEntities(e => {
            const dirLight = e.GetComponent<DirectionalLightComp>(DirectionalLightComp);
            dirLight.rebuildLight(e, ecosystem);
        });
    }
}
