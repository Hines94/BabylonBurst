import { CreateHiddenComponentElements, JSONEditor, CustomInspectorComp } from "./CustomInspectorComponents";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType, GetFullNameOfObject } from "../ContentBrowser/ContentItem";

/** For materials - easy dropdown to pick */
export class CustomMaterialInspectorComp implements CustomInspectorComp {
    BuildCustomElement(editor: JSONEditor): boolean {
        if(!editor.original_schema.$ref.includes("MaterialSpecifier")){
            return false;
        }
        console.log("MAT")
        ProcessMaterialSpecifierComp(editor);
        return true;
    }
}

function ProcessMaterialSpecifierComp(editor:JSONEditor){
    const materialEditor = editor as MaterialSpecifierEditor;
    if(materialEditor.CreatedMaterialDropdown) {
        return;
    }
    
    //Hide all children
    CreateHiddenComponentElements(materialEditor,"Custom Type Material Spec");

    const input = materialEditor.container.ownerDocument.createElement("input");
    input.classList.add('form-control');
    input.style.marginBottom = '5px';
    SetupInputWithDatalist(ContentItemType.Material,input,(val:ContentItem) =>{
        editor.setValue({FilePath:GetFullNameOfObject(val),FileIndex:val.fileIndex})
    })
    materialEditor.container.appendChild(input);
    materialEditor.CreatedMaterialDropdown = input;
    const exist = editor.getValue();
    if(exist.FilePath !== undefined && exist.FileIndex !== undefined){
        var existingItem = GetEditorObjectWithValues(ContentItemType.Material,exist.FilePath,exist.FileIndex);
        SetInputValueFromDatalist(input,existingItem);
    }
}

interface MaterialSpecifierEditor extends JSONEditor {
    CreatedMaterialDropdown?:any;
}