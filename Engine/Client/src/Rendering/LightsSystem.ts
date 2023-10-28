import { GameEcosystem } from "@engine/GameEcosystem";
import { GameSystem } from "@engine/GameLoop/GameSystem";
import { LightingGameSystemPriority } from "@engine/GameLoop/GameSystemPriorities";
import { DirectionalLightComp } from "@engine/Rendering/DirectionalLight";


export class LightingGameSystem extends GameSystem {
    SystemOrdering = LightingGameSystemPriority;

    RunSystem(ecosystem: GameEcosystem) {
        const directLights = ecosystem.entitySystem.GetEntitiesWithData([DirectionalLightComp], []);
        directLights.AddChanged_ALL_Filter();
        directLights.iterateEntities(e => {
            const dirLight = e.GetComponent<DirectionalLightComp>(DirectionalLightComp);
            dirLight.rebuildLight(e, ecosystem);
        });
    }

}