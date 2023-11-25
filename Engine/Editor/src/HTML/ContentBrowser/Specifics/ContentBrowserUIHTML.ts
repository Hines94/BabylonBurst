import { AsyncImageDescription } from "@BabylonBurstCore/AsyncAssets";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { OpenUIEditor } from "../../UI/UIEditor";
import { BlobToString } from "@BabylonBurstClient/Utils/HTMLUtils";
import { decode, encode } from "@msgpack/msgpack";

export class ContentBrowserUIHTML extends ContentBrowserSpecificItem {
    performPrimaryMethod(): void {
        this.openUIEditor();
    }

    async openUIEditor() {
        //Get most recent version
        await this.ourItem.LoadDataAsBuffer(true);
        var data = await decode(this.ourItem.data);
        if (data === undefined || typeof data !== "string") {
            data = `<style data-inlineMe="false">//If you need to linline a style or script set data-inlineMe="true" </style>
<div> 
  <h1>Hello World</h1> 
</div>`;
        }
        OpenUIEditor(this.ourItem, data as string, async (newHTML: string) => {
            this.ourItem.data = encode(newHTML);
            const result = await this.ourItem.SaveItemOut();
            if (!result) {
                alert("Error saving UI!");
            }
        });
    }

    getContextMenuItems(): ContextMenuItem[] {
        return super.getContextMenuItems().concat([]);
    }

    protected cleanupItem(): void {}

    override async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
    }
}
