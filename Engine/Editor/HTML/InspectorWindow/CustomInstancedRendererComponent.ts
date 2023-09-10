import { JSONEditor, CustomInspectorComp } from "./CustomInspectorComponents";
import { FindModelForParams } from "../../Utils/EditorModelSpecifier";

/** For materials - easy dropdown to pick */
export class CustomInstancedRenderInspectorComp implements CustomInspectorComp {
    BuildCustomElement(editor: JSONEditor): boolean {
        if(!editor.original_schema.$ref.includes("InstancedRender")){
            return false;
        }
        ProcessInstancedRenderComp(editor);
        return true;
    }
}

function ProcessInstancedRenderComp(editor:JSONEditor){
    const renderEditor = editor as InstancedRenderEditor;
    if(renderEditor.setupCustomCompEditor) {
        return;
    }
    
    //Create warning if material number not same as material number for 
    const val = renderEditor.getValue();
    const modelSpecifier = FindModelForParams(val.ModelData);
    if(modelSpecifier) {
        console.log(modelSpecifier.materialsNum);
    }

    renderEditor.setupCustomCompEditor = true;
}

interface InstancedRenderEditor extends JSONEditor {
    setupCustomCompEditor?:boolean;
}