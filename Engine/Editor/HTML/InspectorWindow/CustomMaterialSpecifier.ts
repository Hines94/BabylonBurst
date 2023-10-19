import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { Component } from "@engine/EntitySystem/Component";
import { GameEcosystem } from "@engine/GameEcosystem";
import { MaterialSpecifier } from "@engine/Rendering/InstancedRender";

export function ProcessMaterialSpecifierComp(container:HTMLElement, propType:savedProperty, compData:any,ecosystem:GameEcosystem) : boolean {

    if(propType.type !== MaterialSpecifier) {
        return false;
    }
    
    const title = container.ownerDocument.createElement("p");
    title.innerText = propType.name;
    container.appendChild(title);
    const input = container.ownerDocument.createElement("input");
    input.classList.add('form-control');
    input.style.marginBottom = '5px';
    SetupContentInputWithDatalist(ContentItemType.Material,input,(val:ContentItem) =>{
        const newMat = new MaterialSpecifier();
        newMat.FileName = val.GetSaveName();
        newMat.FilePath = val.parent.getItemLocation();
        compData[propType.name] = newMat;
    })
    container.appendChild(input);

    const exist = compData[propType.name];
    if(exist.FilePath !== undefined && exist.FileName !== undefined){
        var existingItem = GetEditorObjectWithValues(ContentItemType.Material,exist.FilePath,exist.FileName);
        SetInputValueFromDatalist(input,existingItem);
    }
    return true;
}