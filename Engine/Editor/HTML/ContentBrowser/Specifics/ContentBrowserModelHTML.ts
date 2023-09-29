import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";

export class ContentBrowserModelHTML extends ContentBrowserSpecificItem {
    getContextMenuItems(): ContextMenuItem[] {
        return [];
    }
    async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
    }
    protected cleanupItem(): void {
        
    }
    performPrimaryMethod(): void {
        alert("Model visualistaion not yet supported");
    }
}
