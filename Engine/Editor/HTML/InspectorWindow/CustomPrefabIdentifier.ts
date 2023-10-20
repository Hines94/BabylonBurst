import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import { SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { decode } from "@msgpack/msgpack";
import { GameEcosystem } from "@engine/GameEcosystem";
import { PrefabSpecifier } from "@engine/EntitySystem/Prefab";

/** Warns if material numbers not correct */
export function ProcessPrefabSpecifierComp(container:HTMLElement, propType:savedProperty, existingData:any, changeCallback:(any)=>void,ecosystem:GameEcosystem) : boolean {

    if(propType.type !== PrefabSpecifier) {
        return false;
    }

    const title = container.ownerDocument.createElement("p");
    title.innerText = propType.name;
    container.appendChild(title);
    const newInput = container.ownerDocument.createElement("input");
    container.appendChild(newInput);
    SetupContentInputWithDatalist(ContentItemType.Prefab,newInput,async (val:ContentItem) =>{
        var value = "";
        if(val !== undefined) {
            const data = await val.GetData();
            value = (await decode(data) as any).prefabID;
        }
        const newData = new PrefabSpecifier();
        newData.prefabUUID = value;
        changeCallback(newData);
    })
    if(existingData.prefabUUID !== undefined) {
        newInput.value = existingData.prefabUUID;
    }
    return true;
}
