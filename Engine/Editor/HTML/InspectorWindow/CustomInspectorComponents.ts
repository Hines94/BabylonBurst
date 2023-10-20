import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { registeredTypes, savedProperties, savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateInnerOuterPanelWithMinimizer } from "@engine/Utils/HTMLUtils";
import { ProcessInstancedRenderComp } from "./CustomInstancedRendererComponent";
import { ProcessModelSpecifierComp } from "./CustomModelSpecifier";
import { isTypeAClass } from "@engine/Utils/TypeRegisterUtils";
import { ProcessMaterialSpecifierComp } from "./CustomMaterialSpecifier";
import { ProcessPrefabSpecifierComp } from "./CustomPrefabIdentifier";


export type editorPropertyCallback = (container:HTMLElement, propType:savedProperty, existingData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem)=>boolean;
var registeredEditorPropertyCallbacks:editorPropertyCallback[] = [];
export function RegisterCustomEditorPropertyGenerator(callback:editorPropertyCallback) {
    registeredEditorPropertyCallbacks.push(callback);
} 

//Register engine callbacks
RegisterCustomEditorPropertyGenerator(ProcessInstancedRenderComp);
RegisterCustomEditorPropertyGenerator(ProcessModelSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessMaterialSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessPrefabSpecifierComp);


export function GenerateEditorProperty(container:HTMLElement, propType:savedProperty, existingData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem) {
    //If array then deal with that
    if(Array.isArray(existingData)) {
        const arrayHeader = container.ownerDocument.createElement("p");
        arrayHeader.textContent = propType.name;
        container.appendChild(arrayHeader);

        const valuesContainer = container.ownerDocument.createElement("div");
        container.appendChild(valuesContainer);
        for(var i = 0; i < existingData.length;i++) {
            GenerateEditorProperty(valuesContainer,propType,existingData[i],(val)=>{
                existingData[i] = val;
            },ecosystem);
        }
        //Create buttons to add and remove elements
        const addButton = container.ownerDocument.createElement("button");
        addButton.textContent = "+";
        container.appendChild(addButton);

        return;
    }

    //Check custom callbacks first
    for(var i = 0; i < registeredEditorPropertyCallbacks.length;i++) {
        if(registeredEditorPropertyCallbacks[i](container,propType,existingData,changeCallback,ecosystem)) {
            return;
        }
    }

    //Generic input types
    if(propType.type === String) {
        generateBasicInput(container,existingData,propType,(input)=>{
            changeCallback(input.value);
        });

    } else if(propType.type === Number) {
        const input = generateBasicInput(container,existingData,propType,(input)=>{
            changeCallback(input.value);
        });
        input.type = "number";
        //TODO: min max/slider?
        console.log("TODO: number variant with slider/minmax?");

    } else if(propType.type === EntityData) {
        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === undefined || input.valueAsNumber === null || input.valueAsNumber === 0) {
                changeCallback(undefined);
            } else {
                var val = ecosystem.entitySystem.GetEntityData(input.valueAsNumber);
                if(val === undefined) {
                    ShowToastNotification(`Entity ${input.valueAsNumber} does not exist! will be undefined`);
                }
                changeCallback(val);
            }
        };
        const input = generateBasicInput(container,existingData,propType,callback);
        if(existingData !== undefined) {
            input.value = existingData.owningEntity;
        } else {
            input.value = "0";
        }
        input.type = "number";

    } else if (propType.type === Boolean) {

        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === 1) {
                changeCallback(true);
            } else {
                changeCallback(false);
            }
        };
        const input = generateBasicInput(container,existingData,propType,callback);
        input.type = "checkbox";

    } else if(isTypeAClass(propType.type)) {
        const subType = registeredTypes[propType.type.name];
        if(subType === undefined) {
            console.error(`Property type ${propType.type.name} - ${propType.name} is not a registered type! Won't display in editor!`);
            return;
        }
        if(existingData === undefined) {
            const spawnSubType = subType.type;
            //@ts-ignore
            changeCallback(new spawnSubType());
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
            GenerateEditorProperty(nestedWrapper.innerPanel,property,existingData[property.name],(val)=>{
                existingData[propType.name][property.name] = val;
            },ecosystem);
        }
        
    } else {
        console.error(`No editor input setup for ${propType.type.name} - prop name ${propType.name}`);
    }
}

function generateBasicInput(container: HTMLElement, existingData: any, propType: savedProperty, changeCallback:(input:HTMLInputElement)=>void) {
    const input = container.ownerDocument.createElement("input");
    input.addEventListener("change", ()=>{changeCallback(input)});
    input.value = existingData;
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
