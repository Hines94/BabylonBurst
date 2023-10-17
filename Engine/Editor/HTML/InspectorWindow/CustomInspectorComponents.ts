import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { Component } from "@engine/EntitySystem/Component";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { EntitySystem } from "@engine/EntitySystem/EntitySystem";
import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GameEcosystem } from "@engine/GameEcosystem";


export function RegisterCustomEditorPropertyGenerator(callback:(container:HTMLElement, propType:savedProperty, compData:Component)=>boolean) {
    console.log("TODO: Custom callback stuff")
} 

export function GenerateEditorProperty(container:HTMLElement, propType:savedProperty, compData:Component,ecosystem:GameEcosystem) {

    if(propType.type === String) {
        generateBasicInput(container, compData, propType);

    } else if(propType.type === Number) {
        const input = generateBasicInput(container,compData,propType);
        input.type = "number";
        //TODO: min max/slider?
        console.log("TODO: number variant with slider/minmax?");

    } else if(propType.type === EntityData) {
        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === undefined || input.valueAsNumber === null || input.valueAsNumber === 0) {
                compData[propType.name] = undefined;
            } else {
                compData[propType.name] = ecosystem.entitySystem.GetEntityData(input.valueAsNumber);
                if(compData[propType.name] === undefined) {
                    ShowToastNotification(`Entity ${input.valueAsNumber} does not exist! will be undefined`);
                }
            }
        };
        const input = generateBasicInput(container,compData,propType,callback);
        if(compData[propType.name] !== undefined) {
            input.value = compData[propType.name].owningEntity;
        } else {
            input.value = "0";
        }
        input.type = "number";

    } else if (propType.type === Boolean) {

        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === 1) {
                compData[propType.name] = true;
            } else {
                compData[propType.name] = false;
            }
        };
        const input = generateBasicInput(container,compData,propType,callback);
        input.type = "checkbox";

    } if(typeof propType.type === "object") {
        console.log("TODO: Setup nested items");
        
    } else {
        console.error(`No editor input setup for ${propType.type}`);
    }
    console.error("TODO: Figure out how to display arrays!!!")
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
