import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { Component } from "@engine/EntitySystem/Component";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { EntitySystem } from "@engine/EntitySystem/EntitySystem";
import { registeredTypes, savedProperties, savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateInnerOuterPanelWithMinimizer } from "@engine/Utils/HTMLUtils";
import { ProcessInstancedRenderComp } from "./CustomInstancedRendererComponent";
import { ProcessModelSpecifierComp } from "./CustomModelSpecifier";
import { isTypeAClass } from "@engine/Utils/TypeRegisterUtils";
import { ProcessMaterialSpecifierComp } from "./CustomMaterialSpecifier";
import { ProcessPrefabSpecifierComp } from "./CustomPrefabIdentifier";


export type editorPropertyCallback = (container:HTMLElement, propType:savedProperty, compData:Component,ecosystem:GameEcosystem)=>boolean;
var registeredEditorPropertyCallbacks:editorPropertyCallback[] = [];
export function RegisterCustomEditorPropertyGenerator(callback:editorPropertyCallback) {
    registeredEditorPropertyCallbacks.push(callback);
} 

//Register engine callbacks
RegisterCustomEditorPropertyGenerator(ProcessInstancedRenderComp);
RegisterCustomEditorPropertyGenerator(ProcessModelSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessMaterialSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessPrefabSpecifierComp);


export function GenerateEditorProperty(container:HTMLElement, propType:savedProperty, parentData:any,ecosystem:GameEcosystem) {
    if(Array.isArray(parentData[propType.name])) {
        console.error("TODO: Figure out how to display arrays!!!");
        return;
    }

    //Check custom callbacks first
    for(var i = 0; i < registeredEditorPropertyCallbacks.length;i++) {
        if(registeredEditorPropertyCallbacks[i](container,propType,parentData,ecosystem)) {
            return;
        }
    }

    if(propType.type === String) {
        generateBasicInput(container, parentData, propType);

    } else if(propType.type === Number) {
        const input = generateBasicInput(container,parentData,propType);
        input.type = "number";
        //TODO: min max/slider?
        console.log("TODO: number variant with slider/minmax?");

    } else if(propType.type === EntityData) {
        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === undefined || input.valueAsNumber === null || input.valueAsNumber === 0) {
                parentData[propType.name] = undefined;
            } else {
                parentData[propType.name] = ecosystem.entitySystem.GetEntityData(input.valueAsNumber);
                if(parentData[propType.name] === undefined) {
                    ShowToastNotification(`Entity ${input.valueAsNumber} does not exist! will be undefined`);
                }
            }
        };
        const input = generateBasicInput(container,parentData,propType,callback);
        if(parentData[propType.name] !== undefined) {
            input.value = parentData[propType.name].owningEntity;
        } else {
            input.value = "0";
        }
        input.type = "number";

    } else if (propType.type === Boolean) {

        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === 1) {
                parentData[propType.name] = true;
            } else {
                parentData[propType.name] = false;
            }
        };
        const input = generateBasicInput(container,parentData,propType,callback);
        input.type = "checkbox";

    } else if(isTypeAClass(propType.type)) {
        const subType = registeredTypes[propType.type.name];
        if(subType === undefined) {
            console.error(`Property type ${propType.type.name} in ${parentData.constructor.name} - ${propType.name} is not a registered type! Won't display in editor!`);
            return;
        }
        if(parentData[propType.name] === undefined) {
            const spawnSubType = subType.type;
            parentData[propType.name] = new spawnSubType();
        }
        const nestedWrapper = GenerateInnerOuterPanelWithMinimizer(container.ownerDocument);
        const title = container.ownerDocument.createElement("h3");
        title.innerText = propType.name;
        nestedWrapper.innerPanel.classList.add("hidden");
        nestedWrapper.outerPanel.insertBefore(title,nestedWrapper.innerPanel);
        container.appendChild(nestedWrapper.outerPanel);
        //TODO: get all properties
        const compSavedProps = savedProperties[subType.type.name];
        for(var c = 0; c < compSavedProps.length;c++) {
            const property = compSavedProps[c];
            GenerateEditorProperty(nestedWrapper.innerPanel,property,parentData[propType.name],ecosystem);
        }
        
    } else {
        console.error(`No editor input setup for ${propType.type.name} - prop name ${propType.name} - comp ${parentData.constructor.name}`);
    }
}

function generateBasicInput(container: HTMLElement, compData: Component, propType: savedProperty, changeCallback:(input:HTMLInputElement)=>void = undefined) {
    const input = container.ownerDocument.createElement("input");
    if(changeCallback === undefined) {
        input.addEventListener("change", () => {
            //TODO: Validate?
            compData[propType.name] = input.value;
        });
    } else {
        input.addEventListener("change", ()=>{changeCallback(input)});
    }
    input.value = compData[propType.name];
    input.style.width = "100%";
    input.style.marginTop = "0px";
    if(propType.options.editorViewOnly) {
        input.disabled = true;
    }
    const label = container.ownerDocument.createElement("p");
    label.innerText = propType.name;
    label.style.marginBottom = "0px";
    label.style.marginTop = "10px";
    container.appendChild(label);
    container.appendChild(input);
    return input;
}
