import { SetupContentInputWithDatalist } from "../../Utils/ContentTypeTrackers";
import { JSONEditor, CustomInspectorComp } from "./CustomInspectorComponents";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { decode } from "@msgpack/msgpack";

/** Warns if material numbers not correct */
export class CustomPrefabIdentifierInspectorComp implements CustomInspectorComp {
    BuildCustomElement(editor: JSONEditor): boolean {
        if(editor.input === undefined || !editor.input.id.includes("PrefabUUID") || (editor.input.parentElement as any).PrefabIDSetup){
            return false;
        }
        (editor.input.parentElement as any).PrefabIDSetup = true;
        const newInput = editor.input.ownerDocument.createElement("input");
        editor.input.parentElement.appendChild(newInput);
        SetupContentInputWithDatalist(ContentItemType.Prefab,newInput,async (val:ContentItem) =>{
            var value = "";
            if(val !== undefined) {
                const data = await val.GetData();
                value = (await decode(data) as any).prefabID;
            }
            editor.input.value = value;
            editor.setValue(value);
        })
        return true;
    }
}
