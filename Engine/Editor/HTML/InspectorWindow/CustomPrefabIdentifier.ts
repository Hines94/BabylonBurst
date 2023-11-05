import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { decode } from "@msgpack/msgpack";
import { GameEcosystem } from "@engine/GameEcosystem";
import { PrefabSpecifier } from "@engine/EntitySystem/Prefab";
import { Observable } from "@babylonjs/core";
import { PrefabManager } from "@engine/EntitySystem/PrefabManager";

/** Warns if material numbers not correct */
export function ProcessPrefabSpecifierComp(container:HTMLElement, propType:savedProperty, parentData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem, requireRefresh:Observable<void>) : boolean {

    if(propType.type !== PrefabSpecifier) {
        return false;
    }

    const title = container.ownerDocument.createElement("p");
    title.innerText = propType.name;
    container.appendChild(title);
    const newInput = container.ownerDocument.createElement("input");
    newInput.style.width = "100%";
    container.appendChild(newInput);
    SetupContentInputWithDatalist(ContentItemType.Prefab,newInput,async (val:ContentItem) =>{
        if(val !== undefined) {
            var data = await val.GetData();
            if(data instanceof Blob) {
                data = await data.arrayBuffer();
            }
            const newData = new PrefabSpecifier();
            newData.prefabUUID = (await decode(data) as any).prefabID;
            changeCallback(newData);
        } else {
            const newData = new PrefabSpecifier();
            newData.prefabUUID = "";
            changeCallback(newData);
        }
    })

    RefreshToData();
    requireRefresh.add(RefreshToData);

    return true;

    function RefreshToData() {
        const existingData = parentData[propType.name];
        if (existingData.prefabUUID !== undefined) {
            newInput.value = PrefabManager.GetPrefabBundleNameFromId(existingData.prefabUUID);
        } else {
            newInput.value = "";
        }
    }
}
