import { Observable } from "@babylonjs/core";
import { ContentItem, ContentItemType } from "../HTML/ContentBrowser/ContentItem";



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
export function SetupInputWithDatalist(contentType:ContentItemType,dropdownSelector:HTMLInputElement, onChange:(val:ContentItem)=>void){
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

export async function TrackAllObjectTypes(topLevel:AssetFolder) : Promise<void> {
    //TODO: For items with multiple bundled together seperate them somehow
    trackedObjects = {};
    await GetAllObjectTypesPathsRecurs(topLevel);
    if(editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}

async function GetAllObjectTypesPathsRecurs(itemsFolder:AssetFolder) : Promise<void>{
    //Recursive check all
    const itemsId = Object.keys(itemsFolder.containedItems);
    
    for(var i = 0; i < itemsId.length;i++) {
        const element = itemsId[i];
        const item = itemsFolder.containedItems[element];
        //Is folder?
        if('containedItems' in item) {
            await GetAllObjectTypesPathsRecurs(item);
            return;
        }
        //Is asset bundle
        if(!trackedObjects[item.category]){
            trackedObjects[item.category] = [];
        }
        console.log("TODO: Finish tracking recursive!")
        // const zippedFile = AsyncZipPuller.GetOrFindAsyncPuller()
        // const items = await GetAllZippedFileNames(await )
        // trackedObjects[item.category].push(item);
    }
}