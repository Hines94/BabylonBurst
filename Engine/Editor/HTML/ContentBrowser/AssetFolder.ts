import { VisualItem } from "./VisualItem";
import { AssetBundle } from "./AssetBundle";
import { IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { ContentItem } from "HTML/ContentBrowser/ContentItem";
import { RefreshObjectTypeTracking } from "../../Utils/ContentTypeTrackers";



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

    async SaveItemOut(): Promise<boolean> {
        const allBundles = this.getAllContainedBundles();
        for(var b = 0; b < allBundles.length;b++) {
            if(!await allBundles[b].SaveItemOut()) {
                console.error("Error saving bundle for folder: " + allBundles[b].name);
            }
        }
        return true;
    }

    async DeleteItem(): Promise<boolean> {
        const allBundles = this.getAllContainedBundles();
        for(var b = 0; b < allBundles.length;b++){
            if(!await allBundles[b].DeleteItem()) {
                console.error("Error deleting asset bundle: " + allBundles[b].name);
                return false;
            }
        }
        RefreshObjectTypeTracking();
        return true;
    }

    GetFullFolderPath():string {
        //Top level folder?
        if(this.name === undefined) {
            return "";
        }
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

    getAllContainedBundles():AssetBundle[] {
        return recursiveGetAllContainedBundles(this);
    }

    GetBundleWithName(name:string) {
        const test = this.containedItems.filter(b=>{return b.name === name});
        if(test.length > 0) {
            return test[0];
        }
        return undefined;
    }

    GetFolderWithName(name:string) {
        const test = this.containedFolders.filter(b=>{return b.name === name});
        if(test.length > 0) {
            return test[0];
        }
        return undefined;
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

    async RemoveBundle(bundle:AssetBundle, bSaveOut = true) : Promise<boolean> {
        if(!this.containedItems.includes(bundle)) {
            return false;
        }
        this.containedItems = this.containedItems.filter(i=>{return i !== bundle});
        if(bSaveOut) {
            return await bundle.DeleteItem();
        }
        return true;
    }

    RemoveFolder(folder:AssetFolder) {
        if(!this.containedFolders.includes(folder)) {
            return false;
        }
        this.containedFolders = this.containedFolders.filter(i=>{return i !== folder});
        return true;
    }
    
    /** Move a bundle into this folder */
    async MoveAssetBundle(bundle:AssetBundle) : Promise<boolean> {
        if(bundle.parent === this) {
            return true;
        }
        await bundle.updateStoredItemsData();
        await bundle.parent.RemoveBundle(bundle);
        bundle.parent = this;
        this.containedItems.push(bundle);
        return await bundle.SaveItemOut();
    }

    async MoveAssetFolder(folder:AssetFolder) : Promise<boolean> {
        if(folder.parent === this) {
            return true;
        }
        if(folder === this) {
            return false;
        }
        //First update data for all bundles inside
        const allBundles = folder.getAllContainedBundles();
        for(var b = 0; b < allBundles.length;b++) {
            await allBundles[b].updateStoredItemsData();
            await allBundles[b].DeleteItem();
        }
        folder.parent.RemoveFolder(folder);
        folder.parent = this;
        this.containedFolders.push(folder);
        await folder.SaveItemOut();
        return true;
    }
}

function recursiveGetAllContainedBundles(item:AssetFolder):AssetBundle[] {
    var ret:AssetBundle[] = item.containedItems;
    for(var f= 0; f < item.containedFolders.length;f++){
        ret = ret.concat(recursiveGetAllContainedBundles(item.containedFolders[f]));
    }
    return ret;
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