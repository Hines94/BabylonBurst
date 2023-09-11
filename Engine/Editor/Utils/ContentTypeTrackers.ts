import { Observable } from "@babylonjs/core";
import { ContentItem, ContentItemType, GetFullNameOfObject } from "../HTML/ContentBrowser/ContentItem";



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

export function GetEditorObjectWithValues(contentType:ContentItemType,path:string,index:number) {
    return GetAllEditorObjectsOfType(contentType).find(v=>{
        return GetFullNameOfObject(v) === path && index === v.fileIndex;
    })
}

export function SetInputValueFromDatalist(dropdownSelector:HTMLInputElement, item:ContentItem) {
    if(!item) {
        return;
    }
    dropdownSelector.value = item.readableName + " - " + item.fileIndex;
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
            opt.value = i.readableName + " - " + i.fileIndex;
            opt.setAttribute("dataItem",JSON.stringify({Path:GetFullNameOfObject(i),Index:i.fileIndex}))
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
            const editorObject = GetEditorObjectWithValues(contentType,value.Path,value.Index);
            if(editorObject) {
                onChange(editorObject);
            }
        }
    })
}

export function TrackAllObjectTypes(topLevel:ContentItem) {
    //TODO: For items with multiple bundled together seperate them somehow
    trackedObjects = {};
    GetAllObjectTypesPathsRecurs(topLevel);
    if(editorObjectCategoriesChange) {
        editorObjectCategoriesChange.notifyObservers(trackedObjects);
    }
}

function GetAllObjectTypesPathsRecurs(itemsFolder:ContentItem) {
    //Recursive check all
    const itemsId = Object.keys(itemsFolder.containedItems);
    
    itemsId.forEach(element => {
        const item = itemsFolder.containedItems[element];
        if(item.category === ContentItemType.Folder) {
            GetAllObjectTypesPathsRecurs(item);
        }
        if(!trackedObjects[item.category]){
            trackedObjects[item.category] = [];
        }
        trackedObjects[item.category].push(item);
    });
}