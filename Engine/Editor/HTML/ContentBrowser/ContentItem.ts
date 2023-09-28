import { AsyncZipPuller, IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { VisualItem } from "./VisualItem";
import { AssetBundle } from "./AssetBundle";
import { AssetFolder } from "./AssetFolder";
import { AsyncDataType, GetZippedFile, ZippedEntry } from "@BabylonBurstClient/AsyncAssets/Utils/ZipUtils";
import {GetFileExtension} from "@BabylonBurstClient/Utils/StringUtils"


/** Type of content for our editor (or player build) content browser */
export enum ContentItemType {
    Unknown,
    PLACEHOLDER,
    PLACEHOLDER2,
    Prefab,
    Image,
    Datasheet,
    Audio,
    Model,
    Material
}

function toContentItemType<T extends string>(str: T): ContentItemType | null {
    const keys = Object.keys(ContentItemType);
    for (const key of keys) {
        if (key === str) {
            return ContentItemType[key as keyof typeof ContentItemType];
        }
    }
    return null;
}

export function GetContentTypeFromFilename(fileName:string) : ContentItemType {
    const extension = GetFileExtension(fileName);
    if(!extension) {
        return ContentItemType.Unknown;
    }
    return GetContentTypeFromExtension(extension);
}

/** Item may be different types depending on extension */
export function GetContentTypeFromExtension(extension:string) : ContentItemType{
    const str = extension.replace(".","").replace(" ","");
    const converted = toContentItemType(str);
    if(converted !== null) {
        return converted;
    }
    if(str === "png" || str === "jpg") {
        return ContentItemType.Image;
    }
    if(str === "wav") {
        return ContentItemType.Audio;
    }
    return ContentItemType.Unknown;
}

//A content item stored within a bundle
export class ContentItem extends VisualItem {
    category: ContentItemType;
    parent: AssetBundle;
    data?: any;
    size?: number;
    extension?: string;

    constructor(data:{name:string,entry:ZippedEntry}, parent:AssetBundle) {
        super();
        if(data === undefined || parent === undefined) {
            return;
        }
        this.name = data.name;
        this.size = data.entry.size;
        this.parent = parent;
        this.storedBackend = this.parent.storedBackend;
        this.category = GetContentTypeFromFilename(data.name);
        const extension = GetFileExtension(data.name);
        if(extension) {
            this.name = data.name.replace("."+extension,"");
            this.extension = extension;
        }
    }

    async SaveItemOut(): Promise<boolean> {
        console.error("TODO: Fix with asset bundle type")
        // var type = ".txt";
        // if (item.typeExtension) {
        //     type = item.typeExtension;
        // }
        // var array = item.data;
        // if (!Array.isArray(array)) {
        //     array = [item.data];
        // }
        // return backend.StoreZipAtLocation(array, GetFullPathOfObject(item).replace(".zip", ""), type);
        return false;
    }

    DeleteItem(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    GetAllParentLevels(): AssetFolder[] {
        const items: AssetFolder[] = [];
        var parent = parent.parent;
        while (parent) {
            items.unshift(parent);
            parent = parent.parent;
        }
        return items;
    }

    async GetData() : Promise<any> {
        if(this.data) {
            return this.data;
        }
        //Try load data
        return await GetZippedFile(await AsyncZipPuller.GetCachedFile(this.parent.getItemLocation()),AsyncDataType.blob,this.name);
    }

    /** Fallback default if no extension set! */
    GetExtension() : string {
        return ContentItemType[this.category];
    }

    /** Name including extension */
    GetSaveName() : string {
        if(this.extension) {
            return this.name + "." + this.extension;
        }
        return this.name + "." + this.GetExtension();
    }
}

