import { Observable } from "@babylonjs/core";
import { ContentItem, ContentItemType } from "../HTML/ContentBrowser/ContentItem";
import { topLevelEditorFolder } from "../HTML/CustomEditorHTML";
import { AssetFolder } from "../HTML/ContentBrowser/AssetFolder";
import { AssetBundle } from "../HTML/ContentBrowser/AssetBundle";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { decode } from "@msgpack/msgpack";



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
        return v.parent.getItemLocation() === path && fileName === v.GetSaveName();
    })
}

export function SetInputValueFromDatalist(dropdownSelector:HTMLInputElement, item:ContentItem) {
    if(!item) {
        dropdownSelector.value = "";
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
            (opt as any).dataItem = i;
            datalist.appendChild(opt);
        })
        dropdownSelector.ownerDocument.body.appendChild(datalist);
    }
    const datalist = dropdownSelector.ownerDocument.getElementById(datalistName) as HTMLDataListElement;

    dropdownSelector.setAttribute("list",datalistName);
    dropdownSelector.addEventListener("change",()=>{
        const option = Array.from(datalist.querySelectorAll('option')).find(opt => opt.value === dropdownSelector.value);
        if (option) {
            ShowToastNotification("Changed data item to " + option.value,3000,dropdownSelector.ownerDocument);
            onChange((option as any).dataItem);
        } else {
            ShowToastNotification("Changed data item to UNDEFINED",3000,dropdownSelector.ownerDocument);
            onChange(undefined);
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
            ShowToastNotification("Changed data item to " + option.value,3000,dropdownSelector.ownerDocument);
            onChange((option as any).BUNDLE);
        } else {
            ShowToastNotification("Changed data item to UNDEFINED",3000,dropdownSelector.ownerDocument);
            onChange(undefined);
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
            ShowToastNotification("Changed data item to " + option.value,3000,dropdownSelector.ownerDocument);
            onChange((option as any).ASSETFOLDER);
        } else {
            ShowToastNotification("Changed data item to UNDEFINED",3000,dropdownSelector.ownerDocument);
            onChange(undefined);
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
    RefreshFolderTracking(false);
    RefreshBundleTracking(false);
    if(editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}

export function RefreshFolderTracking(bCallEvent = true) {
    const allFolders = topLevelEditorFolder.getAllContainedFolders();
    trackedObjects["FOLDERS"] = allFolders;
    trackedObjects["FOLDERS"].push(topLevelEditorFolder);
    if(bCallEvent && editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}

export function RefreshBundleTracking(bCallEvent = true) {
    const allBundles = topLevelEditorFolder.getAllContainedBundles();
    trackedObjects["BUNDLES"] = allBundles;
    if(bCallEvent && editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}