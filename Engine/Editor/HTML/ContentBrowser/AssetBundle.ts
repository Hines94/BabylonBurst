import { VisualItem } from "./VisualItem";
import { AssetFolder } from "./AssetFolder";
import { ContentItem } from "./ContentItem";
import { AsyncAWSBackend, IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { GetAllZippedFileDatas } from "@BabylonBurstClient/AsyncAssets/Utils/ZipUtils";
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
        const result = await (this.storedBackend as AsyncAWSBackend).deleteObject(this.getItemLocation());
        if(result) {
            RefreshObjectTypeTracking();
        }
        return result;
    }
    getItemLocation():string {
        return this.parent.GetFullFolderPath() + this.name + ".zip";
    }

    async refreshContainedItems() {
        this.storedItems = [];
        const contained = await GetAllZippedFileDatas(await this.storedBackend.GetItemAtLocation(this.getItemLocation()));
        contained.forEach(d=>{
            this.storedItems.push(new ContentItem(d,this));
        })
        this.refreshPromise = undefined;
        RefreshObjectTypeTracking();
    }

    async updateStoredItemsData() {
        for(var i = 0; i < this.storedItems.length;i++) {
            //Should download if we don't already have the data!
            this.storedItems[i].data = this.storedItems[i].GetData();
        }
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
