
interface ModelSpecifierEditor extends JSONEditor {
    CreatedModelDropdown?:any;
    key:string;
}

//TODO: Make this generic and easy to register (eg some sort of class base or something)
function ProcessCustomElements(editor:JSONEditor) {
    if(!editor.original_schema.$ref) {
        return;
    }
    if(editor.original_schema.$ref.includes("ModelSpecifier")) {
        const modelEditor = editor as ModelSpecifierEditor;
        if(modelEditor.CreatedModelDropdown) {
            return;
        }

        //Hide all children
        const hiddenElements = modelEditor.container.ownerDocument.createElement("div");
        while (modelEditor.container.firstChild) {
            hiddenElements.appendChild(modelEditor.container.firstChild);
        }
        modelEditor.container.appendChild(hiddenElements);
        hiddenElements.style.display = "none";
        hiddenElements.style.padding = "2px";

        //TODO: Make this hide stuff a method in the base class
        const titleEle = modelEditor.container.ownerDocument.createElement("div");
        titleEle.style.display = "flex";
        modelEditor.container.appendChild(titleEle);
        const paramName = modelEditor.container.ownerDocument.createElement("span");
        paramName.innerText = modelEditor.key;
        paramName.style.flex = "1";
        titleEle.appendChild(paramName);
        
        const hideButton = modelEditor.container.ownerDocument.createElement("button");
        hideButton.innerHTML = "Custom Type Model Spec &darr;";
        hideButton.onclick = ()=>{
            if(hiddenElements.style.display === "none"){
                hiddenElements.style.display = "block";
                hideButton.innerHTML = "Custom Type Model Spec &uarr;";
                modelEditor.container.style.border = "1px solid lightgray";
            } else {
                hiddenElements.style.display = "none";
                hideButton.innerHTML = "Custom Type Model Spec &darr;";
                modelEditor.container.style.border = "none";
            }
        }
        titleEle.appendChild(hideButton);

        //TODO: Make this list/input stuff generic
        if(!modelEditor.container.ownerDocument.getElementById("___ModelsList___")) {
            const modelsList = modelEditor.container.ownerDocument.createElement("datalist");
            modelsList.id = '___ModelsList___';
            const testEle = modelEditor.container.ownerDocument.createElement("option");
            testEle.innerText = "test";
            modelsList.appendChild(testEle);
            modelEditor.container.ownerDocument.body.appendChild(modelsList);
        }

        const input = modelEditor.container.ownerDocument.createElement("input");
        input.setAttribute('list', '___ModelsList___');
        input.setAttribute('name', 'addModels');
        input.classList.add('form-control');
        input.style.marginBottom = '5px';

        modelEditor.container.appendChild(input);
        modelEditor.CreatedModelDropdown = input;
        
    }
}

type originalSchema = {
    $ref?:string;
}

type JSONEditor = {
    original_schema?:originalSchema;
    editors?:JSONEditor[];
    container:HTMLElement;
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