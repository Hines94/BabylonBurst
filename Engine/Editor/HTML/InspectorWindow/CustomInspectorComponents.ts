import { CustomInstancedRenderInspectorComp } from "./CustomInstancedRendererComponent";
import { CustomMaterialInspectorComp } from "./CustomMaterialSpecifier";
import { CustomModelInspectorComp } from "./CustomModelSpecifier";


function ProcessCustomElements(editor:JSONEditor) {
    //Register any default engine items here
    if(!registeredDefaultComps) {
        RegisterCustomInspectorComponent(new CustomModelInspectorComp());
        RegisterCustomInspectorComponent(new CustomMaterialInspectorComp());
        RegisterCustomInspectorComponent(new CustomInstancedRenderInspectorComp());

        registeredDefaultComps = true;
    }
    //Run through any custom comps and see if we get a hit
    for(var c = 0; c < registeredCustomInspectorComps.length;c++){
        registeredCustomInspectorComps[c].BuildCustomElement(editor);
    }
}

type originalSchema = {
    $ref?:string;
    items?:{$ref?:string};
}

export type JSONEditor = {
    original_schema?:originalSchema;
    schema?:originalSchema;
    editors?:JSONEditor[];
    rows?:JSONEditor[];
    container?:HTMLElement;
    root_container?:HTMLElement;
    key:string;
    setValue:(val:any)=>void;
    getValue:()=>any;
    on:(evName:string,evCallback:()=>void)=>void;
    boundOn?:boolean;
    setupCustomEditorBB:string[];
}

export interface CustomInspectorComp {
    /** Returns if built */
    BuildCustomElement(editor:JSONEditor):boolean;
}

/** Is this custom setup valid and not already done? */
export function RequiresSetupForCustom(comp:string, editor:JSONEditor) : boolean {
    //Check schema if relevant
    if(!editor.original_schema || !editor.original_schema.$ref) {
        //In regular schema?
        if(!editor.schema || !editor.schema.$ref || !editor.schema.$ref.includes(comp)){
            return false;
        }
    } else {
        if(!editor.original_schema.$ref.includes(comp)) {
            return false;
        }
    }
    //Passed name check - already setup?
    if(!editor.setupCustomEditorBB) {
        editor.setupCustomEditorBB = [];
    }
    if(editor.setupCustomEditorBB.includes(comp)) {
        return false;
    }
    editor.setupCustomEditorBB.push(comp);
    //Full pass
    return true;
}

var registeredDefaultComps = false;
var registeredCustomInspectorComps:CustomInspectorComp[] = [];

export function RegisterCustomInspectorComponent(comp:CustomInspectorComp) {
    registeredCustomInspectorComps.push(comp);
}

/** Hide a property or entire component structure but allow user to manually open and enter text */
export function CreateHiddenComponentElements(modelEditor: JSONEditor, showButtonText:string) {
    const hiddenElements = modelEditor.container.ownerDocument.createElement("div");
    while (modelEditor.container.firstChild) {
        hiddenElements.appendChild(modelEditor.container.firstChild);
    }
    modelEditor.container.appendChild(hiddenElements);
    hiddenElements.style.display = "none";
    hiddenElements.style.padding = "2px";

    const titleEle = modelEditor.container.ownerDocument.createElement("div");
    titleEle.style.display = "flex";
    modelEditor.container.appendChild(titleEle);
    const paramName = modelEditor.container.ownerDocument.createElement("span");
    paramName.innerText = modelEditor.key;
    paramName.style.flex = "1";
    titleEle.appendChild(paramName);

    const hideButton = modelEditor.container.ownerDocument.createElement("button");
    hideButton.innerHTML = showButtonText + " &darr;";
    hideButton.onclick = () => {
        if (hiddenElements.style.display === "none") {
            hiddenElements.style.display = "block";
            hideButton.innerHTML = showButtonText +" &uarr;";
            modelEditor.container.style.border = "1px solid lightgray";
        } else {
            hiddenElements.style.display = "none";
            hideButton.innerHTML = showButtonText +" &darr;";
            modelEditor.container.style.border = "none";
        }
    };
    titleEle.appendChild(hideButton);
}

export function CheckEditorForCustomElements(editor:JSONEditor) {
    //Find components
    ProcessCustomElements(editor);

    //Is Array?
    if(editor.constructor.name === "CustomArrayEditor" && !editor.boundOn) {
        if(editor.on){
            editor.on("change", function () {
                processEditorRows()
            })
        }
        editor.boundOn = true;
    }
    //Children of this element
    if(editor.editors) {
        const keys = Object.keys(editor.editors);
        for(var k = 0; k < keys.length;k++) {
            CheckEditorForCustomElements(editor.editors[keys[k]])
        }
    }
    processEditorRows();

    function processEditorRows() {
        if (editor.rows) {
            const keys = Object.keys(editor.rows);
            for (var k = 0; k < keys.length; k++) {
                editor.rows[keys[k]].original_schema["$ref"] = editor.original_schema.items.$ref;
                CheckEditorForCustomElements(editor.rows[keys[k]]);
            }
        }
    }
}