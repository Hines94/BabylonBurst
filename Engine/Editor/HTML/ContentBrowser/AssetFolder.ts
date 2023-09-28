import { VisualItem } from "./VisualItem";
import { AssetBundle } from "./AssetBundle";
import { IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { ContentItem } from "HTML/ContentBrowser/ContentItem";



//A folder level that stores a number of items
export class AssetFolder extends VisualItem {
    containedFolders:AssetFolder[] = [];
    containedItems:AssetBundle[] = [];
    parent:AssetFolder;

    constructor(name:string,backend:IBackendStorageInterface) {
        super();
        this.name = name;
        this.storedBackend = backend;
    }

    SaveItemOut(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    DeleteItem(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    GetFullFolderPath():string {
        var ret = this.name + "/";
        var item:AssetFolder = this;
        while(item.parent !== undefined && item.parent.name !== undefined) {
            ret = item.parent.name + "/" + ret;
            item = item.parent;
        }
        return ret;
    }

    GetAllParentFolders() : AssetFolder[] {
        var ret:AssetFolder[] = [];
        var item:AssetFolder = this.parent;
        while(item.parent !== undefined) {
            ret.unshift(item);
            item = item.parent;
        }
        return ret;
    }

    getAllContainedAssets():ContentItem[] {
        return recursiveGetAllContentItems(this);
    }

    getNewAssetBundleName():string {
        var newName = "NewAssetBundle";
        var i = 1;
        while(this.containedItems.filter(b=>{return b.name === newName}).length !== 0) {
            i+=1;
            newName = "NewAssetBundle_" + i;
        }
        return newName;
    }

    GenerateNewAssetBundle():AssetBundle {
        const newBundle = new AssetBundle({
            name:this.getNewAssetBundleName(),
            storedBackend:this.storedBackend,
            lastModified:new Date(),
            parent:this,
            bAutoRefresh:false,
        });
        this.containedItems.push(newBundle);
        return newBundle;
    }

    getNewFolderName():string {
        var newName = "NewFolder";
        var i = 0;
        while(this.containedFolders.filter(b=>{return b.name === newName}).length !== 0) {
            i+=1;
            newName = "NewFolder_" + i;
        }
        return newName;
    }

    GenerateNewFolder() : AssetFolder {
        const newFolder = new AssetFolder(this.getNewFolderName(),this.storedBackend);
        newFolder.parent = this;
        this.containedFolders.push(newFolder);
        return newFolder;
    }
}

function recursiveGetAllContentItems(item:AssetFolder):ContentItem[] {
    var ret:ContentItem[] = [];
    for(var i = 0; i < item.containedItems.length;i++){
        ret = ret.concat(item.containedItems[i].storedItems);
    }
    for(var f= 0; f < item.containedFolders.length;f++){
        ret = ret.concat(recursiveGetAllContentItems(item.containedFolders[f]));
    }
    return ret;
}