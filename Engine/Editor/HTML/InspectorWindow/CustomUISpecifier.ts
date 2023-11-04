import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { UISpecifier } from "@BabylonBurstClient/GUI/UISpecifier"
import { GameEcosystem } from "@engine/GameEcosystem";
import { Observable } from "@babylonjs/core";

export function ProcessUISpecifierComp(container:HTMLElement, propType:savedProperty, parentData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem, requireRefresh:Observable<void>) : boolean {

    if(propType.type !== UISpecifier) {
        return false;
    }
    
    const input = container.ownerDocument.createElement("input");
    input.classList.add('form-control');
    input.style.marginBottom = '5px';
    SetupContentInputWithDatalist(ContentItemType.UI,input,(val:ContentItem) =>{
        const newUI = new UISpecifier();
        if(val === undefined || val === null) {
            changeCallback(newUI);
        } else {
            newUI.FileName = val.GetSaveName();
            newUI.FilePath = val.parent.getItemLocation();
            changeCallback(newUI);
        }
    })
    container.appendChild(input);


    RefreshValueToComp();

    requireRefresh.add(RefreshValueToComp);

    return true;

    function RefreshValueToComp() {
        const existingData = parentData[propType.name];
        if (existingData.FilePath !== undefined && existingData.FileName !== undefined) {
            var existingItem = GetEditorObjectWithValues(ContentItemType.UI, existingData.FilePath, existingData.FileName);
            SetInputValueFromDatalist(input, existingItem);
        }
    }
}