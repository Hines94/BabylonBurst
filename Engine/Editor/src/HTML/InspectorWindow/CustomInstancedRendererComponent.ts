import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { FindModelForParams, ModelPaths } from "../../Utils/EditorModelSpecifier";
import { Component } from "@engine/EntitySystem/Component";
import { GameEcosystem } from "@engine/GameEcosystem";
import { InstancedRender } from "@engine/Rendering/InstancedRender";
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
            console.log("Check");
            warning.hidden = true;
            if (existingData.MaterialData && modelSpecifier.materialsNum !== existingData.MaterialData.length) {
                warning.hidden = false;
                warning.innerText = "Incorrect number of materials. Model specifies " + modelSpecifier.materialsNum;
                console.log("Warning triggered");
            }
        } else {
            warning.hidden = true;
        }
    }
}
