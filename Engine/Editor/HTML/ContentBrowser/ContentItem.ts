import { VisualItem } from "./VisualItem";
import { AssetBundle } from "./AssetBundle";
import { AssetFolder } from "./AssetFolder";
import { GetFileExtension } from "@engine/Utils/StringUtils"
import { AsyncDataType, ZippedEntry } from "@engine/AsyncAssets/Utils/ZipUtils";
import { AsyncArrayBufferLoader } from "@engine/Utils/StandardAsyncLoaders";


/** Type of content for our editor (or player build) content browser */
export enum ContentItemType {
    Unknown,
    Prefab,
    Image,
    Datasheet,
    Audio,
    Model,
    Material,
    UI
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
    if(str === "gltf" || str === "glb" || str === ".babylon") {
        return ContentItemType.Model;
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

    SaveItemOut(): Promise<boolean> {
        //TODO: Ensure our data is up to date?
        return this.parent.SaveItemOut();
    }

    DeleteItem(): Promise<boolean> {
        this.parent.storedItems = this.parent.storedItems.filter(i=>{return i !== this});
        return this.parent.SaveItemOut();
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
        if(this.data !== undefined && this.data !== null) {
            return this.data;
        }
        //Try load data
        return await this.parent.GetDataForItem(this.GetSaveName(),AsyncDataType.blob,false);
    }

    async LoadDataAsBuffer(bIgnoreCache = false) {
        const loader = new AsyncArrayBufferLoader(this.parent.getItemLocation(), this.GetSaveName(),true,bIgnoreCache);
        await loader.getWaitForFullyLoadPromise();
        this.data = loader.rawData;
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

