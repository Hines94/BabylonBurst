import { Component } from "@engine/EntitySystem/Component";
import { savedProperty } from "@engine/EntitySystem/TypeRegister";


export function RegisterCustomEditorPropertyGenerator(callback:(container:HTMLElement, propType:savedProperty, compData:Component)=>boolean) {
    console.log("TODO: Custom callback stuff")
} 

export function GenerateEditorProperty(container:HTMLElement, propType:savedProperty, compData:Component) {
    if(propType.isArray) {
        console.log("TODO: Handle arrays!");
    } else if(propType.type === String) {
        generateBasicInput(container, compData, propType);
    } else if(propType.type === Number) {
        const input = generateBasicInput(container,compData,propType);
        input.type = "number";
        //TODO: min max/slider?
        console.log("TODO: number variant with slider/minmax?");
    } else {
        console.error(`No editor input setup for ${propType.type}`);
        console.log("TODO: Setup nested items");
    }
}

function generateBasicInput(container: HTMLElement, compData: Component, propType: savedProperty) {
    const input = container.ownerDocument.createElement("input");
    input.addEventListener("change", () => {
        //TODO: Validate?
        compData[propType.name] = input.value;
    });
    const label = container.ownerDocument.createElement("p");
    label.innerText = propType.name;
    container.appendChild(label);
    container.appendChild(input);
    return input;
}
