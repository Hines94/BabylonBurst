import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";


export class ContentBrowserUnknownHTML extends ContentBrowserSpecificItem {
    getContextMenuItems(): ContextMenuItem[] {
        return [];
    }
    async drawInspectorInfo(): Promise<void> {
        
    }
    protected cleanupItem(): void {
        
    }
    performPrimaryMethod(): void {
        alert("Unknown item type. Exists in S3 storage. Set type with ~ContentItemType~ identifier in name.");
    }
}
