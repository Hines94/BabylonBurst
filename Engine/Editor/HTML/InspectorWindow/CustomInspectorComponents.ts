import { CustomModelInspectorComp } from "./CustomModelSpecifier";

//TODO: Make this generic and easy to register (eg some sort of class base or something)
function ProcessCustomElements(editor:JSONEditor) {
    if(!editor.original_schema.$ref) {
        return;
    }
    //Register any default engine items here
    if(!registeredDefaultComps) {
        RegisterCustomInspectorComponent(new CustomModelInspectorComp());

        registeredDefaultComps = true;
    }
    //Run through any custom comps and see if we get a hit
    for(var c = 0; c < registeredCustomInspectorComps.length;c++){
        if(registeredCustomInspectorComps[c].BuildCustomElement(editor)){
            return;
        }
    }
}

type originalSchema = {
    $ref?:string;
}

export type JSONEditor = {
    original_schema?:originalSchema;
    editors?:JSONEditor[];
    container:HTMLElement;
    key:string;
    setValue:(val:any)=>void;
    getValue:()=>any;
}

export interface CustomInspectorComp {
    /** Returns if built */
    BuildCustomElement(editor:JSONEditor):boolean;
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
    if(editor.original_schema) {
        //Find components
        ProcessCustomElements(editor);
    }
    if(editor.editors) {
        const keys = Object.keys(editor.editors);
        for(var k = 0; k < keys.length;k++) {
            CheckEditorForCustomElements(editor.editors[keys[k]])
        }
    }
}