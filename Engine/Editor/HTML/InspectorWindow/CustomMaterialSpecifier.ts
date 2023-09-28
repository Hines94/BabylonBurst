import { CreateHiddenComponentElements, JSONEditor, CustomInspectorComp, RequiresSetupForCustom } from "./CustomInspectorComponents";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";

/** For materials - easy dropdown to pick */
export class CustomMaterialInspectorComp implements CustomInspectorComp {
    BuildCustomElement(editor: JSONEditor): boolean {
        if(!RequiresSetupForCustom("MaterialSpecifier",editor)){
            return false;
        }
        ProcessMaterialSpecifierComp(editor);
        return true;
    }
}

function ProcessMaterialSpecifierComp(materialEditor:JSONEditor){
    
    //Hide all children
    CreateHiddenComponentElements(materialEditor,"Custom Type Material Spec");

    const input = materialEditor.container.ownerDocument.createElement("input");
    input.classList.add('form-control');
    input.style.marginBottom = '5px';
    SetupInputWithDatalist(ContentItemType.Material,input,(val:ContentItem) =>{
        materialEditor.setValue({FilePath:val.parent.getItemLocation(),FileName:val.name})
    })
    materialEditor.container.appendChild(input);
    const exist = materialEditor.getValue();
    if(exist.FilePath !== undefined && exist.FileName !== undefined){
        var existingItem = GetEditorObjectWithValues(ContentItemType.Material,exist.FilePath,exist.FileName);
        SetInputValueFromDatalist(input,existingItem);
    }
}