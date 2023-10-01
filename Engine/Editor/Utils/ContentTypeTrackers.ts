import { Observable } from "@babylonjs/core";
import { ContentItem, ContentItemType } from "../HTML/ContentBrowser/ContentItem";
import { topLevelEditorFolder } from "../HTML/CustomEditorHTML";
import { AssetFolder } from "../HTML/ContentBrowser/AssetFolder";
import { AssetBundle } from "../HTML/ContentBrowser/AssetBundle";



type TrackedContentObjects = {
    [objTypes:number]:ContentItem[]
}

var trackedObjects:TrackedContentObjects = {};

export const editorObjectCategoriesChange = new Observable<TrackedContentObjects>();

export function GetAllEditorObjectsOfType(type:ContentItemType):ContentItem[] {
    if(trackedObjects[type]) {
        return trackedObjects[type];
    }
    return [];
}

export function GetEditorObjectWithValues(contentType:ContentItemType,path:string,fileName:string) {
    return GetAllEditorObjectsOfType(contentType).find(v=>{
        return v.parent.getItemLocation() === path && fileName === v.name;
    })
}

export function SetInputValueFromDatalist(dropdownSelector:HTMLInputElement, item:ContentItem) {
    if(!item) {
        return;
    }
    dropdownSelector.value = item.parent.name + " - " + item.name;
}

/** Easy way of automatically setting up dropdown to select a file */
export function SetupContentInputWithDatalist(contentType:ContentItemType,dropdownSelector:HTMLInputElement, onChange:(val:ContentItem)=>void){
    const datalistName = "___DATALIST___" + contentType + "___ITEMS___";
    if(!dropdownSelector.ownerDocument.getElementById(datalistName)) {
        const datalist = dropdownSelector.ownerDocument.createElement("datalist");
        datalist.id = datalistName;
        const allItems = GetAllEditorObjectsOfType(contentType);
        allItems.forEach(i=>{
            const opt =  dropdownSelector.ownerDocument.createElement("option");
            opt.value = i.parent.name + " - " + i.name;
            opt.setAttribute("dataItem",JSON.stringify({Path:i.parent.getItemLocation(),FileName:i.name}))
            datalist.appendChild(opt);
        })
        dropdownSelector.ownerDocument.body.appendChild(datalist);
    }
    const datalist = dropdownSelector.ownerDocument.getElementById(datalistName) as HTMLDataListElement;

    dropdownSelector.setAttribute("list",datalistName);
    dropdownSelector.addEventListener("change",()=>{
        const option = Array.from(datalist.querySelectorAll('option')).find(opt => opt.value === dropdownSelector.value);
        if (option) {
            const value = JSON.parse(option.getAttribute("dataItem"));
            const editorObject = GetEditorObjectWithValues(contentType,value.Path,value.FileName);
            if(editorObject) {
                onChange(editorObject);
            }
        }
    })
}

/** Dropdown with bundles to select */
export function SetupBundleInputWithDatalist(dropdownSelector:HTMLInputElement, onChange:(val:AssetBundle)=>void){
    const datalistName = "___DATALIST___BUNDLES___ITEMS___";
    if(!dropdownSelector.ownerDocument.getElementById(datalistName)) {
        const datalist = dropdownSelector.ownerDocument.createElement("datalist");
        datalist.id = datalistName;
        const allItems = trackedObjects["BUNDLES"];
        allItems.forEach((i:AssetBundle)=>{
            const opt =  dropdownSelector.ownerDocument.createElement("option");
            opt.value = i.name;
            (opt as any).BUNDLE = i;
            datalist.appendChild(opt);
        })
        dropdownSelector.ownerDocument.body.appendChild(datalist);
    }
    const datalist = dropdownSelector.ownerDocument.getElementById(datalistName) as HTMLDataListElement;

    dropdownSelector.setAttribute("list",datalistName);
    dropdownSelector.addEventListener("change",()=>{
        const option = Array.from(datalist.querySelectorAll('option')).find(opt => opt.value === dropdownSelector.value);
        if (option) {
            onChange((option as any).BUNDLE);
        }
    })
}


/** Dropdown with folders to select */
export function SetupFolderInputWithDatalist(dropdownSelector:HTMLInputElement, onChange:(val:AssetFolder)=>void){
    const datalistName = "___DATALIST___FOLDERS___ITEMS___";
    if(!dropdownSelector.ownerDocument.getElementById(datalistName)) {
        const datalist = dropdownSelector.ownerDocument.createElement("datalist");
        datalist.id = datalistName;
        const allItems = trackedObjects["FOLDERS"];
        allItems.forEach((i:AssetFolder)=>{
            const opt =  dropdownSelector.ownerDocument.createElement("option");
            opt.value = i.name;
            (opt as any).ASSETFOLDER = i;
            datalist.appendChild(opt);
        })
        dropdownSelector.ownerDocument.body.appendChild(datalist);
    }
    const datalist = dropdownSelector.ownerDocument.getElementById(datalistName) as HTMLDataListElement;

    dropdownSelector.setAttribute("list",datalistName);
    dropdownSelector.addEventListener("change",()=>{
        const option = Array.from(datalist.querySelectorAll('option')).find(opt => opt.value === dropdownSelector.value);
        if (option) {
            onChange((option as any).ASSETFOLDER);
        }
    })
}

export async function RefreshObjectTypeTracking() : Promise<void> {
    trackedObjects = {};
    const allItems = topLevelEditorFolder.getAllContainedAssets();
    for(var i = 0; i < allItems.length;i++){
        const item = allItems[i];
        if(!trackedObjects[item.category]){
            trackedObjects[item.category] = [];
        }
        trackedObjects[item.category].push(item);
    }
    const allFolders = topLevelEditorFolder.getAllContainedFolders();
    trackedObjects["FOLDERS"] = allFolders;
    trackedObjects["FOLDERS"].push(topLevelEditorFolder);
    const allBundles = topLevelEditorFolder.getAllContainedBundles();
    trackedObjects["BUNDLES"] = allBundles;
    if(editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}