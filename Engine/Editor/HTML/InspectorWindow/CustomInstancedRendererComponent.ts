import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { FindModelForParams, ModelPaths } from "../../Utils/EditorModelSpecifier";
import { Component } from "@engine/EntitySystem/Component";
import { GameEcosystem } from "@engine/GameEcosystem";
import { InstancedRender } from "@engine/Rendering/InstancedRender";


export function ProcessInstancedRenderComp(container:HTMLElement, propType:savedProperty, compData:Component,ecosystem:GameEcosystem) : boolean {
    if(propType.type !== InstancedRender) {
        return false;
    }

    //Create warning if material number not same as material number for 
    const warning = container.ownerDocument.createElement("div");
    warning.className = "alert alert-danger";
    container.appendChild(warning)

    const propVal = compData[propType.name];

    //TODO: Hook into change
    refreshMaterialsNumWarning();


    return false;


    function refreshMaterialsNumWarning() {

        const modelSpecifier = FindModelForParams(propVal);
        if (modelSpecifier) {
            warning.hidden = true;
            if (propVal.MaterialData && modelSpecifier.materialsNum !== propVal.MaterialData.length) {
                warning.hidden = false;
                warning.innerText = "Incorrect number of materials. Model specifies " + modelSpecifier.materialsNum;
            }
        } else {
            warning.hidden = true;
        }
    }
}