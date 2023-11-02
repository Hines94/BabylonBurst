import { ContentBrowserMaterialHTML } from "./Specifics/ContentBrowserMaterialHTML";
import { ContentBrowserHTML } from "./ContentBrowserHTML";
import { ContentItem, ContentItemType } from "./ContentItem";
import { ContentBrowserAudioClipHTML } from "./Specifics/ContentBrowserAudioClipHTML";
import { ContentBrowserDatasheetHTML } from "./Specifics/ContentBrowserDatasheetHTML";
import { ContentBrowserImageHTML } from "./Specifics/ContentBrowserImageHTML";
import { ContentBrowserModelHTML } from "./Specifics/ContentBrowserModelHTML";
import { ContentBrowserPrefabHTML } from "./Specifics/ContentBrowserPrefabHTML";
import { ContentBrowserUnknownHTML } from "./Specifics/ContentBrowserUnknownHTML";
import { ContentBrowserIconedItemHTML } from "HTML/ContentBrowser/Specifics/ContentBrowserIconedItemHTML";
import { ContentBrowserUIHTML } from "./Specifics/ContentBrowserUIHTML";

export function GetContentItemHTMLSpecific(
    item: ContentItem,
    ourContentHolder: ContentBrowserHTML
): ContentBrowserIconedItemHTML {
    if (item.category === ContentItemType.Unknown) {
        return new ContentBrowserUnknownHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Prefab) {
        return new ContentBrowserPrefabHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Image) {
        return new ContentBrowserImageHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Datasheet) {
        return new ContentBrowserDatasheetHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Audio) {
        return new ContentBrowserAudioClipHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Model) {
        return new ContentBrowserModelHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.Material) {
        return new ContentBrowserMaterialHTML(ourContentHolder,item);
    }
    if (item.category === ContentItemType.UI) {
        return new ContentBrowserUIHTML(ourContentHolder,item);
    }
    console.error("Cant find content browser item type for category: " + ContentItemType[item.category]);
    return null;
}
