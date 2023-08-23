import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";
import { hideColliderVisualSystem, showVisualsProp } from "@BabylonBoostClient/Rendering/ColliderVisualRenderSystem";
import { AddOptionToEditorTopMenu } from "../../Utils/EditorTopMenu";

/** All visualistaion options such as view colliders etc */
export function SetupAllEditorVisualisations(ecosystem: GameEcosystem) {
    SetupColliderVisualisation(ecosystem);
}

function refreshColliderVisualDropdown(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties[showVisualsProp]) {
        ecosystem.dynamicProperties["___COLLIDERVISUALSINDICATOR___"].innerHTML = "Show Colliders &#10003";
    } else {
        ecosystem.dynamicProperties["___COLLIDERVISUALSINDICATOR___"].innerHTML = "Show Colliders";
        hideColliderVisualSystem(ecosystem);
    }
}

function SetupColliderVisualisation(ecosystem: GameEcosystem) {
    const colliderOption = AddOptionToEditorTopMenu(ecosystem, "View", "Show Colliders");
    ecosystem.dynamicProperties["___COLLIDERVISUALSINDICATOR___"] = colliderOption;
    colliderOption.addEventListener("click", () => {
        if (ecosystem.dynamicProperties[showVisualsProp]) {
            ecosystem.dynamicProperties[showVisualsProp] = false;
        } else {
            ecosystem.dynamicProperties[showVisualsProp] = true;
        }
        refreshColliderVisualDropdown(ecosystem);
    });
}
