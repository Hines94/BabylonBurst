import { savedProperty } from "@BabylonBurstCore/EntitySystem/TypeRegister";
import { FindModelForParams, ModelPaths } from "../../Utils/EditorModelSpecifier";
import { Component } from "@BabylonBurstCore/EntitySystem/Component";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { InstancedRender } from "@BabylonBurstCore/Rendering/InstancedRender";
import { Observable } from "@babylonjs/core";

export function ProcessInstancedRenderComp(
    container: HTMLElement,
    propType: savedProperty,
    existingData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
): boolean {
    if (propType.type !== InstancedRender) {
        return false;
    }

    //Create warning if material number not same as material number for
    const warning = container.ownerDocument.createElement("div");
    warning.className = "alert alert-danger";
    container.appendChild(warning);

    requireRefresh.add(() => {
        refreshMaterialsNumWarning();
    });

    return false;

    function refreshMaterialsNumWarning() {
        const modelSpecifier = FindModelForParams(existingData);
        if (modelSpecifier) {
            warning.hidden = true;
            if (existingData.MaterialData && modelSpecifier.materialsNum !== existingData.MaterialData.length) {
                warning.hidden = false;
                warning.innerText = "Incorrect number of materials. Model specifies " + modelSpecifier.materialsNum;
            }
        } else {
            warning.hidden = true;
        }
    }
}
