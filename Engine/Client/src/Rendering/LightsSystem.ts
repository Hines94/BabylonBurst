import { GameEcosystem } from "@engine/GameEcosystem";
import { DirectionalLightComp } from "@engine/Rendering/DirectionalLight";

export function RunLightsSystem(ecosystem: GameEcosystem) {
    const directLights = ecosystem.entitySystem.GetEntitiesWithData([DirectionalLightComp], []);
    directLights.AddChanged_ALL_Filter();
    directLights.iterateEntities(e => {
        const dirLight = e.GetComponent<DirectionalLightComp>(DirectionalLightComp);
        dirLight.rebuildLight(e, ecosystem);
    });
}
