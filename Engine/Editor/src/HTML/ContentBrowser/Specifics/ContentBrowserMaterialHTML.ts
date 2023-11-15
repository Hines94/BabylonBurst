import { decode } from "@msgpack/msgpack";
import { OpenMaterial } from "../../Materials/MaterialEditor";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { AsyncArrayBufferLoader } from "@engine/Utils/StandardAsyncLoaders";

export class ContentBrowserMaterialHTML extends ContentBrowserSpecificItem {
    getContextMenuItems(): ContextMenuItem[] {
        return super.getContextMenuItems().concat([]);
    }
    async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
    }
    protected cleanupItem(): void {}

    performPrimaryMethod(): void {
        this.openMaterial();
    }

    async openMaterial() {
        await this.loadContentMaterial();
        OpenMaterial(decode(this.ourItem.data), this.ourItem.name, (newData: any) => {
            //Request save
            this.ourItem.data = newData;
            this.ourItem.SaveItemOut();
        });
    }

    protected async loadContentMaterial() {
        if (this.ourItem.data) {
            return;
        }
        const loader = new AsyncArrayBufferLoader(this.ourItem.parent.getItemLocation(), this.ourItem.GetSaveName());
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }
}
