import { ContentBrowserMaterialHTML } from "./Specifics/ContentBrowserMaterialHTML";
import { ContentBrowserHTML } from "./ContentBrowserHTML";
import { ContentBrowserItemHTML } from "./ContentBrowserItemHTML";
import { ContentItem, ContentItemType } from "./ContentItem";
import { ContentBrowserAudioClipHTML } from "./Specifics/ContentBrowserAudioClipHTML";
import { ContentBrowserDatasheetHTML } from "./Specifics/ContentBrowserDatasheetHTML";
import { ContentBrowserFolderHTML } from "./Specifics/ContentBrowserFolderHTML";
import { ContentBrowserImageHTML } from "./Specifics/ContentBrowserImageHTML";
import { ContentBrowserModelHTML } from "./Specifics/ContentBrowserModelHTML";
import { ContentBrowserPrefabHTML } from "./Specifics/ContentBrowserPrefabHTML";
import { ContentBrowserUnknownHTML } from "./Specifics/ContentBrowserUnknownHTML";

export function GetContentItemHTMLSpecific(
    item: ContentItem,
    div: HTMLElement,
    ourContentHolder: ContentBrowserHTML
): ContentBrowserItemHTML {
    if (item.category === ContentItemType.Unknown) {
        return new ContentBrowserUnknownHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Folder) {
        return new ContentBrowserFolderHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Prefab) {
        return new ContentBrowserPrefabHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Image) {
        return new ContentBrowserImageHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Datasheet) {
        return new ContentBrowserDatasheetHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Audio) {
        return new ContentBrowserAudioClipHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Model) {
        return new ContentBrowserModelHTML(item, div, ourContentHolder);
    }
    if (item.category === ContentItemType.Material) {
        return new ContentBrowserMaterialHTML(item, div, ourContentHolder);
    }
    console.error("Cant find content browser item type for category: " + ContentItemType[item.category]);
    return null;
}
