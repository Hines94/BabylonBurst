import { OpenNewWindow } from "@BabylonBurstClient/HTML/HTMLWindowManager";
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from "@codemirror/basic-setup";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";



export async function OpenUIEditor(uiName:string, existingHTML:string,saveCallback:(newHTML:string)=>void) {
    const Displayer = OpenNewWindow(uiName, "EditorSections/UIDisplayer", "UI " + uiName);
    if (!Displayer) {
        return;
    }
    const displayerElement = await Displayer.loadingElement;
    displayerElement.querySelector("#UIName").innerHTML = uiName;
    const previewElement = displayerElement.querySelector('#HTMLDisplay') as HTMLDivElement;

    //Setup
    const state = EditorState.create({
        doc: existingHTML,
        extensions: [html(), oneDark, autocompletion() ]
      });
    const view = new EditorView({
        state,
        parent: displayerElement.querySelector("#HTMLCoding")
    });

    const newHTML = state.doc.toString();
    RebuildUI(newHTML, previewElement)
    checkRebuildUI(view, previewElement, displayerElement, newHTML);

    //Save out callback
    displayerElement.querySelector("#UISave").addEventListener("click",()=>{
        saveCallback(view.state.doc.toString());
        const savB = displayerElement.querySelector("#UISave") as HTMLButtonElement;
        savB.style.color = "white";
        savB.innerText = "Save Changes";
    });
    
}

function checkRebuildUI(view:EditorView, previewElement:HTMLDivElement, parentElement:HTMLDivElement, priorState:string) {
    const newHtml = view.state.doc.toString();
    if(newHtml !== priorState) {
        const savB = parentElement.querySelector("#UISave") as HTMLButtonElement;
        savB.style.color = "red";
        savB.innerText = "Unsaved Changes";
        RebuildUI(newHtml,previewElement);
    }
    setTimeout(function(){
        checkRebuildUI(view, previewElement,parentElement,newHtml)
    },1000);
}

async function RebuildUI(newHtml:string, previewElement:HTMLDivElement) {
    //TODO: Parse out images etc to load them in
    previewElement.innerHTML = newHtml;
}

