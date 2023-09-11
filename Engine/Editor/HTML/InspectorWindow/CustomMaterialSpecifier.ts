import { CreateHiddenComponentElements, JSONEditor, CustomInspectorComp, RequiresSetupForCustom } from "./CustomInspectorComponents";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType, GetFullNameOfObject } from "../ContentBrowser/ContentItem";

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
        materialEditor.setValue({FilePath:GetFullNameOfObject(val),FileIndex:val.fileIndex})
    })
    materialEditor.container.appendChild(input);
    const exist = materialEditor.getValue();
    if(exist.FilePath !== undefined && exist.FileIndex !== undefined){
        var existingItem = GetEditorObjectWithValues(ContentItemType.Material,exist.FilePath,exist.FileIndex);
        SetInputValueFromDatalist(input,existingItem);
    }
}