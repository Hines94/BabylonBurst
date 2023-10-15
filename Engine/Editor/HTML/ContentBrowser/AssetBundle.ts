import { VisualItem } from "./VisualItem";
import { AssetFolder } from "./AssetFolder";
import { ContentItem, ContentItemType } from "./ContentItem";
import { AsyncAWSBackend, AsyncZipPuller, IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { AsyncDataType, GetAllZippedFileDatas } from "@BabylonBurstClient/AsyncAssets/Utils/ZipUtils";
import { FileZipData } from "@BabylonBurstClient/AsyncAssets/Framework/StorageInterfaceTypes";
import { RefreshObjectTypeTracking } from "../../Utils/ContentTypeTrackers";


//A bundle that holds an item (the .zip archive)
export class AssetBundle extends VisualItem {
    storedItems:ContentItem[] = [];
    parent:AssetFolder;
    size:number;

    refreshPromise:Promise<void>;
    bAutoRefresh = true;

    constructor(data:Partial<AssetBundle>) {
        super();
        Object.assign(this,data);
        if(this.bAutoRefresh) {
            this.refreshPromise = this.refreshContainedItems();
        }
    }

    async SaveItemOut(): Promise<boolean> {
        //Get all data for this item
        const backend = (this.storedBackend as AsyncAWSBackend);
        const dataItems:FileZipData[] = [];
        for(var d = 0; d < this.storedItems.length;d++) {
            const dat = this.storedItems[d];
            const data:FileZipData = {name:dat.GetSaveName(),data:await dat.GetData()};
            if(data.data === undefined || data.data === null) {
                console.warn("Trying to save with undefined data!");
            }
            dataItems.push(data);
        }
        const result = await backend.StoreZipAtLocation(dataItems,this.getItemLocation());
        if(result) {
            RefreshObjectTypeTracking();
        }
        return result;
    }
    async DeleteItem(): Promise<boolean> {
        var result = await (this.storedBackend as AsyncAWSBackend).deleteObject(this.getItemLocation());
        if(result === false) {
            result = await (this.storedBackend as AsyncAWSBackend).deleteObject(this.getPredownloadOpposite());
        }
        RefreshObjectTypeTracking();
        return result;
    }

    getContainsItemType(type:ContentItemType):boolean {
        for(var i = 0; i < this.storedItems.length;i++) {
            if(this.storedItems[i].category === type) {
                return true;
            }
        }
        return false;
    }

    isPredownloadAsset() : boolean {
        if(this.getContainsItemType(ContentItemType.Prefab)) {
            return true;
        }
        return false;
    }

    private getPredownloadOpposite() {
        var location = this.getItemLocation();
        if(this.isPredownloadAsset()) {
            return location.replace("~p~","");
        }
        return location.replace(".zip","") + "~p~.zip";
    }

    //If we have a prefab need to save as a prefab due to predownloading reasons
    getItemLocation():string {
        if(this.isPredownloadAsset()) {
            return this.parent.GetFullFolderPath() + this.name + "~p~" + ".zip";
        }
        return this.parent.GetFullFolderPath() + this.name + ".zip";
    }

    async refreshContainedItems() {
        this.storedItems = [];
        var ourData = null;
        try {
            ourData =await this.storedBackend.GetItemAtLocation(this.getItemLocation());
        } catch {
            ourData =  await this.storedBackend.GetItemAtLocation(this.getPredownloadOpposite());
        }
        const contained = await GetAllZippedFileDatas(ourData);
        contained.forEach(d=>{
            this.storedItems.push(new ContentItem(d,this));
        })
        this.refreshPromise = undefined;
        RefreshObjectTypeTracking();
    }

    async updateStoredItemsData() {
        for(var i = 0; i < this.storedItems.length;i++) {
            //Should download if we don't already have the data!
            this.storedItems[i].data = await this.storedItems[i].GetData();
        }
    }

    async GetDataForItem(itemSaveName:string,type:AsyncDataType,bIgnoreCache:boolean) {
        console.log("LOC: " + itemSaveName);
        const result = await AsyncZipPuller.LoadFileData(this.getItemLocation(),itemSaveName,type,bIgnoreCache);
        if(result !== null) {
            return result;
        }
        return await AsyncZipPuller.LoadFileData(this.getPredownloadOpposite(),itemSaveName,type,bIgnoreCache);
    }

    RemoveItem(item:ContentItem,bSave = true) {
        this.storedItems = this.storedItems.filter(i=>{return i !== item});
        if(bSave){
            this.SaveItemOut();
        }
    }

    
    GetItemByName(name:string) {
        const check = this.storedItems.filter(i=>{return i.name === name});
        if(check.length === 0){
            return undefined;
        }
        return check[0];
    }

    async MoveItemIntoThisBundle(item:ContentItem) : Promise<boolean> {
        if(item.parent === this) {
            return true;
        }
        item.data = await item.GetData();
        item.parent.RemoveItem(item);
        item.parent = this;
        this.storedItems.push(item);
        return this.SaveItemOut();
    }

    async CloneBundle() : Promise<boolean> {
        const newBundle = this.parent.GenerateNewAssetBundle();
        newBundle.size = this.size;
        for(var i = 0; i < this.storedItems.length;i++){
            this.storedItems[i].data = await this.storedItems[i].GetData();
            const newItem = new ContentItem(undefined,undefined);
            Object.assign(newItem,this.storedItems[i]);
            newBundle.storedItems.push(newItem);
            newItem.parent = newBundle;
        }
        return await newBundle.SaveItemOut();
    }
}
