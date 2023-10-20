import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { IsValidModelSpecifier, ModelPaths, onModelPathsChangeObserver } from "../../Utils/EditorModelSpecifier";
import { ShowToastError } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { Component } from "@engine/EntitySystem/Component";
import { GameEcosystem } from "@engine/GameEcosystem";
import { ModelSpecifier } from "@engine/Rendering/InstancedRender";



export function ProcessModelSpecifierComp(container:HTMLElement, propType:savedProperty, existingData:ModelSpecifier, changeCallback:(any)=>void,ecosystem:GameEcosystem) : boolean {

    if(propType.type !== ModelSpecifier) {
        return false;
    }

    //TODO: Make this list/input stuff generic
    if(!container.ownerDocument.getElementById("___ModelsList___")) {
        const modelsList = container.ownerDocument.createElement("datalist");
        modelsList.id = '___ModelsList___';
        SetDatalistModelSpecififers(modelsList);
        onModelPathsChangeObserver.add(newList=>{
            SetDatalistModelSpecififers(modelsList);
        })
        container.ownerDocument.body.appendChild(modelsList);
    }

    const title = container.ownerDocument.createElement("p");
    title.innerText = propType.name;
    container.appendChild(title);
    
    const input = container.ownerDocument.createElement("input");
    input.setAttribute('list', '___ModelsList___');
    input.setAttribute('name', 'addModels');
    input.classList.add('form-control');
    input.style.marginBottom = '5px';

    if(existingData === undefined){
        changeCallback(new ModelSpecifier());
    }
    if(existingData.MeshName !== undefined && !IsValidModelSpecifier(existingData)) {
        input.value = "INVALID: " + GetModelSpecifierAbbrevText(existingData);
    } else {
        input.value = GetModelSpecifierAbbrevText(existingData);
    }
    

    input.addEventListener("change",()=>{
        const selectedText = input.value;
        const optionsList = input.ownerDocument.getElementById('___ModelsList___');
        const option = Array.from(optionsList.querySelectorAll('option')).find(opt => opt.innerText === selectedText);
        if (option) {
            const value = JSON.parse(option.getAttribute("data-model")) as ModelSpecifier;
            const newItem = new ModelSpecifier();
            Object.assign(newItem,value);
            changeCallback(newItem);
        } else {
            ShowToastError("Issue finding value for mesh option " + selectedText);
        }
    })

    container.appendChild(input);
    return true;
}

function GetModelSpecifierAbbrevText(element:ModelSpecifier) {
    if(!element || !element.FilePath) {
        return "";
    }
    return  element.FilePath.replace("~7~","").replace(".zip","") + " - " + element.MeshName;
}

function SetDatalistModelSpecififers(list:HTMLDataListElement) {
    if(!list) {
        return;
    }
    while(list.firstChild){
        list.firstChild.remove();
    }
    for(var i = 0; i < ModelPaths.length;i++) {
        const opt = list.ownerDocument.createElement("option");
        opt.innerText = GetModelSpecifierAbbrevText(ModelPaths[i].specifier);
        opt.setAttribute("data-model",JSON.stringify(ModelPaths[i].specifier));
        list.appendChild(opt);
    }
}
