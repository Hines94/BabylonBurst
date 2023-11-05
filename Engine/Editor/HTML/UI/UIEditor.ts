import { OpenNewWindow } from "@BabylonBurstClient/HTML/HTMLWindowManager";
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from "@codemirror/basic-setup";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { SetupElementToCursor } from "@engine/Utils/HTMLUtils";
import {SetupLoadedHTMLUI} from "@BabylonBurstClient/GUI/HTMLUILoader"


export async function OpenUIEditor(uiName:string, existingHTML:string,saveCallback:(newHTML:string)=>void) {
    const Displayer = OpenNewWindow(uiName, "EditorSections/UIDisplayer", "UI " + uiName);
    if (!Displayer) {
        return;
    }
    const displayerElement = await Displayer.loadingElement;
    displayerElement.querySelector("#UIName").innerHTML = uiName;
    const previewElement = displayerElement.querySelector('#HTMLDisplay') as HTMLDivElement;
    const editorElement = displayerElement.querySelector(`#HTMLCoding`) as HTMLDivElement;

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
    //Right click
    setupRightClickEditor(editorElement, view);
}

function setupRightClickEditor(editor:HTMLDivElement, view:EditorView) {
    editor.addEventListener('contextmenu',(e)=>{

        ShowContextMenu(e,[
            {
                name:"Add Image",
                fontSize:"x-small",
                callback:()=>{
                    const input = editor.ownerDocument.createElement("input");
                    editor.ownerDocument.body.appendChild(input);
                    SetupElementToCursor(e,input);
                    //Get all images
                    SetupContentInputWithDatalist(ContentItemType.Image,input,(val:ContentItem) =>{
                        if(val !== undefined) {
                            insertDiv(view,`<div style="width:500px;height:500px;background-color:green;" data-bgpath="${val.parent.getItemLocation()}" data-bgfilename="${val.GetSaveName()}" data-bghasalpha="true"  />`);
                        }
                        input.remove();
                    },"Added Async Image Div: ")
                }
            },
            {
                name:"Link Other UI",
                fontSize:"x-small",
                callback:()=>{
                    const input = editor.ownerDocument.createElement("input");
                    editor.ownerDocument.body.appendChild(input);
                    SetupElementToCursor(e,input);
                    //Get all images
                    SetupContentInputWithDatalist(ContentItemType.UI,input,(val:ContentItem) =>{
                        //TODO: Dissalow own item
                        if(val !== undefined) {
                            insertDiv(view,
                            `<div style="width:500px;height:500px;background-color:green;" data-uipath="${val.parent.getItemLocation()}" data-uifilename="${val.GetSaveName()}">
                            </div>`);
                        }
                        input.remove();
                    }, "Added Other UI: ")
                }
            }
        ], editor.ownerDocument);
    })
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
    previewElement.innerHTML = newHtml;
    //Parse out images etc to load them in
    SetupLoadedHTMLUI(previewElement);
}

function insertDiv(view:EditorView,divContent = "<div></div>" ) {
    // Get the current selection
    const { from, to } = view.state.selection.main;

    // Create a changeset to replace the selection (or cursor position) with the div
    const changes = { from, to, insert: divContent };

    // Apply the changes to the editor
    view.dispatch({
        changes,
        scrollIntoView: true
    });
}
