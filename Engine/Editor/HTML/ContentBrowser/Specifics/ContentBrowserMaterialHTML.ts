import { decode } from "@msgpack/msgpack";
import { OpenMaterial } from "../../Materials/MaterialEditor";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { AsyncArrayBufferLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";

export class ContentBrowserMaterialHTML extends ContentBrowserSpecificItem {

    getContextMenuItems(): ContextMenuItem[] {
        return [];
    }
    async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
    }
    protected cleanupItem(): void {
        
    }

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
