import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { registeredTypes, savedProperties, savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateInnerOuterPanelWithMinimizer, isAttachedToDOM } from "@engine/Utils/HTMLUtils";
import { ProcessInstancedRenderComp } from "./CustomInstancedRendererComponent";
import { ProcessModelSpecifierComp } from "./CustomModelSpecifier";
import { isTypeAClass } from "@engine/Utils/TypeRegisterUtils";
import { ProcessMaterialSpecifierComp } from "./CustomMaterialSpecifier";
import { ProcessPrefabSpecifierComp } from "./CustomPrefabIdentifier";
import { Observable } from "@babylonjs/core";


export type editorPropertyCallback = (container:HTMLElement, propType:savedProperty, parentData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem, requireRefresh:Observable<void>)=>boolean;
var registeredEditorPropertyCallbacks:editorPropertyCallback[] = [];
export function RegisterCustomEditorPropertyGenerator(callback:editorPropertyCallback) {
    registeredEditorPropertyCallbacks.push(callback);
} 

//Register engine callbacks
RegisterCustomEditorPropertyGenerator(ProcessInstancedRenderComp);
RegisterCustomEditorPropertyGenerator(ProcessModelSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessMaterialSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessPrefabSpecifierComp);

type ArrayElementSpecifier = {
    ele:HTMLButtonElement;
    clickEv:any;
    changeEvent:(any)=>void;
    mainProperty:any;
}


export function GenerateEditorProperty(container:HTMLElement, propType:savedProperty, parentData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem, requireRefresh:Observable<void>) {
    if(parentData === undefined) {
        console.error("No parent data for " + propType.name)
        return;
    }
    
    var existingData = parentData[propType.name];

//Array
    if(Array.isArray(existingData)) {
        const arrayContainer = container.ownerDocument.createElement("div");
        container.appendChild(arrayContainer);

        const removeButtons:ArrayElementSpecifier[] = [];

        const arrayHeader = container.ownerDocument.createElement("p");
        arrayHeader.textContent = propType.name;
        arrayContainer.appendChild(arrayHeader);

        const valuesContainer = container.ownerDocument.createElement("div");
        arrayContainer.appendChild(valuesContainer);
        for(var i = 0; i < existingData.length;i++) {
            GenerateArrayElement(i, removeButtons, valuesContainer);
        }
        //Create buttons to add and remove elements
        const buttonsContainer = container.ownerDocument.createElement("div");
        buttonsContainer.style.marginTop = "20px";
        arrayContainer.appendChild(buttonsContainer);

        const addButton = container.ownerDocument.createElement("button");
        addButton.textContent = "+";
        addButton.style.width = "50%";
        addButton.addEventListener("click",()=>{
            existingData.push(new propType.type());
            GenerateArrayElement(existingData.length-1, removeButtons, valuesContainer);
        })
        buttonsContainer.appendChild(addButton);
        const clearButton = container.ownerDocument.createElement("button");
        clearButton.textContent = "Clear";
        clearButton.style.width = "50%";
        clearButton.addEventListener("click",()=>{
            if(container.ownerDocument.defaultView.confirm(`Clear the array ${propType.name}?`)) {
                existingData.splice(0,existingData.length);
                valuesContainer.innerHTML = "";
                removeButtons.splice(0,removeButtons.length);
            }
        })
        buttonsContainer.appendChild(clearButton);

        return;
    }

//Custom  callbacks
    for(var i = 0; i < registeredEditorPropertyCallbacks.length;i++) {
        if(registeredEditorPropertyCallbacks[i](container,propType,parentData,changeCallback,ecosystem,requireRefresh)) {
            return;
        }
    }

//String
    if(propType.type === String) {
        generateBasicInput(container,parentData,propType,(input)=>{
            changeCallback(input.value);
        },requireRefresh);
//Number
    } else if(propType.type === Number) {
        const input = generateBasicInput(container,parentData,propType,(input)=>{
            changeCallback(parseFloat(input.value));
        },requireRefresh);
        if(input.value === "") {
            input.value = "0";
        }
        input.type = "number";
        //TODO: min max/slider?
//Entity Data
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
        const input = generateBasicInput(container,parentData,propType,callback,requireRefresh);
        if(existingData !== undefined) {
            input.value = existingData.owningEntity;
        } else {
            input.value = "0";
        }
        input.type = "number";
//Boolean
    } else if (propType.type === Boolean) {

        const callback = (input:HTMLInputElement)=>{
            if(input.valueAsNumber === 1) {
                changeCallback(true);
            } else {
                changeCallback(false);
            }
        };
        const input = generateBasicInput(container,parentData,propType,callback,requireRefresh);
        input.type = "checkbox";

//Nested objects
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
            existingData = spawnSubType;
        }
        const nestedWrapper = GenerateInnerOuterPanelWithMinimizer(container.ownerDocument);
        const title = container.ownerDocument.createElement("h3");
        title.innerText = propType.name;
        nestedWrapper.innerPanel.classList.add("hidden");
        nestedWrapper.outerPanel.insertBefore(title,nestedWrapper.innerPanel);
        container.appendChild(nestedWrapper.outerPanel);
        const compSavedProps = savedProperties[subType.type.name];
        for(var c = 0; c < compSavedProps.length;c++) {
            const property = compSavedProps[c];
            GenerateEditorProperty(nestedWrapper.innerPanel,property,existingData,(val)=>{
                existingData[property.name] = val;
            },ecosystem,requireRefresh);
        }
//Fail 
    } else {
        console.error(`No editor input setup for ${propType.type.name} - prop name ${propType.name}`);
    }

    function GenerateArrayElement(index:number,removeButtons: ArrayElementSpecifier[], valuesContainer: HTMLDivElement) {
        const arrayElementContainer = container.ownerDocument.createElement("div");
        const newEle: ArrayElementSpecifier = {
            ele: undefined,
            changeEvent: undefined,
            clickEv: undefined,
            mainProperty: existingData
        };
        const arraySpecificElement = Object.assign({}, propType);
        arraySpecificElement.name = index.toString();
        GenerateEditorProperty(arrayElementContainer, arraySpecificElement, existingData, (val) => {
            newEle.changeEvent(val);
        }, ecosystem,requireRefresh);
        GenerateArrayRemoveButton(index, removeButtons, arrayElementContainer, newEle);
        valuesContainer.appendChild(arrayElementContainer);
    }

    function GenerateArrayRemoveButton(index:number,removeButtons:ArrayElementSpecifier[], elementContainer: HTMLDivElement, newElementData:ArrayElementSpecifier) {
        const removeButton = container.ownerDocument.createElement("button");
        newElementData.ele = removeButton;
        newElementData.clickEv=undefined;
        newElementData.changeEvent=undefined;
        removeButtons.push(newElementData);
        removeButton.style.width = `100%`;
        GenerateArrayRemoveEvent(index,removeButtons);
        elementContainer.appendChild(removeButton);
    }

    function GenerateArrayRemoveEvent(index:number,removeButtons:ArrayElementSpecifier[]) {
        removeButtons[index].ele.innerText = "Remove: " + index;
        if(removeButtons[index].clickEv !== undefined) {
            removeButtons[index].ele.removeEventListener('click',removeButtons[index].clickEv);
        }
        removeButtons[index].clickEv = () => {
            if (container.ownerDocument.defaultView.confirm(`Remove element ${index}?`)) {
                existingData.splice(index, 1);
                removeButtons[index].ele.parentElement.remove();
                removeButtons.splice(index,1);
                //Regenerate later events
                for(var b = index; b < removeButtons.length;b++) {
                    GenerateArrayRemoveEvent(b,removeButtons);
                }
            }
        }
        removeButtons[index].ele.addEventListener('click',removeButtons[index].clickEv);
        removeButtons[index].changeEvent = (dat)=>{   
            removeButtons[index].mainProperty[index] = dat;
        }
    }
}

function generateBasicInput(container: HTMLElement, parentData:any, propType: savedProperty, changeCallback:(input:HTMLInputElement)=>void,requireRefresh:Observable<void>) {
    const input = container.ownerDocument.createElement("input");
    input.addEventListener("change", ()=>{changeCallback(input)});
    input.value = parentData[propType.name];
    input.style.width = "100%";
    input.style.marginTop = "0px";
    requireRefresh.add(()=>{
        input.value = parentData[propType.name];
    });
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
