import { IBackendStorageInterface } from "rooasyncassets/dist/cjs/Framework/StorageInterfaceTypes";

/** Type of content for our editor (or player build) content browser */
export enum ContentItemType {
    BASEASSETSLAYER,
    Unknown,
    Folder,
    Prefab,
    Image,
    Datasheet,
    Audio,
    Model,
}

export interface ContentItem {
    nameExtension: string;
    readableName: string;
    category: ContentItemType;
    containedItems?: { [id: string]: ContentItem };
    parent: ContentItem;
    lastModified?: Date;
    data?: any;
    size?: number;
    typeExtension?: string;
}

/** TODO: use different backends to save to player data etc? */
export function SaveContentItem(backend: IBackendStorageInterface, item: ContentItem): Promise<boolean> {
    if (item.category === ContentItemType.Folder) {
        backend.StoreDataAtLocation("", GetFullNameOfObject(item).replace(".zip", ""), "");
    } else {
        var type = ".txt";
        if (item.typeExtension) {
            type = item.typeExtension;
        }
        var array = item.data;
        if (!Array.isArray(array)) {
            array = [item.data];
        }
        return backend.StoreZipAtLocation(array, GetFullNameOfObject(item).replace(".zip", ""), type);
    }
}

/** For a content item get all parent levels above */
export function GetAllParentLevels(item: ContentItem): ContentItem[] {
    const items: ContentItem[] = [];
    var parent = item.parent;
    while (parent && parent.category !== ContentItemType.BASEASSETSLAYER) {
        items.unshift(parent);
        parent = parent.parent;
    }
    return items;
}

/** For a content item get a string format with all forlders above */
export function GetFolderStructureFromAllParents(item: ContentItem): string {
    const allParents = GetAllParentLevels(item);
    var ret = "";
    for (var i = 0; i < allParents.length; i++) {
        ret += allParents[i].readableName + "/";
    }
    return ret;
}

export function GetContentItemNameInclType(object: ContentItem): string {
    return (object.readableName + object.nameExtension).replace(".zip", "");
}

export function GetFullNameOfObject(object: ContentItem): string {
    return GetFolderStructureFromAllParents(object) + object.readableName + object.nameExtension;
}
