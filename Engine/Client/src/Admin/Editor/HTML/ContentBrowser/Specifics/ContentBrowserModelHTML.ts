import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";

export class ContentBrowserModelHTML extends ContentBrowserItemHTML {
    protected performPrimaryMethod(): void {
        alert("Unknown item type. Exists in S3 storage. Set type with ~ContentItemType~ identifier in name.");
    }
}
