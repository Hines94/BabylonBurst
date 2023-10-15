import { AsyncImageDescription } from "@engine/AsyncAssets";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";

export class ContentBrowserImageHTML extends ContentBrowserSpecificItem {
    performPrimaryMethod(): void {}

    getContextMenuItems(): ContextMenuItem[] {
        return super.getContextMenuItems().concat([]);
    }
    protected cleanupItem(): void {
        
    }

    override async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
        const inspector = document.getElementById("InspectorPanel") as HTMLElement;
        const image = inspector.querySelector("#ItemImage") as HTMLImageElement;
        this.setImage(image);
    }

    async setImage(element: HTMLImageElement) {
        const asyncImageItem = new AsyncImageDescription(this.ourItem.parent.getItemLocation(),this.ourItem.GetSaveName());
        const imgData = await asyncImageItem.GetImageAsBase64();
        element.src = imgData;
    }
}
