import { AsyncImageDescription } from "@engine/AsyncAssets";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { OpenUIEditor } from "../../UI/UIEditor";
import { BlobToString } from "@engine/Utils/HTMLUtils";
import { decode, encode } from "@msgpack/msgpack";

export class ContentBrowserUIHTML extends ContentBrowserSpecificItem {
    performPrimaryMethod(): void {
        this.openUIEditor();
    }

    async openUIEditor() {
        //Get most recent version
        await this.ourItem.LoadDataAsBuffer(true);
        var data = await decode(this.ourItem.data);
        if(data === undefined || typeof data !== "string") {
            data = 
            `<div> 
                <h1>Hello World</h1> 
            </div>`;
        }
        OpenUIEditor(this.ourItem.name,data as string,async (newHTML:string)=>{
            this.ourItem.data = encode(newHTML);
            const result = await this.ourItem.SaveItemOut();
            if(!result) {
                alert("Error saving UI!");
            }
        });
    }

    getContextMenuItems(): ContextMenuItem[] {
        return super.getContextMenuItems().concat([]);
    }

    protected cleanupItem(): void {
        
    }

    override async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
    }
}
