import { VisualItem } from "./VisualItem";
import { AssetFolder } from "./AssetFolder";
import { ContentItem } from "./ContentItem";
import { AsyncAWSBackend, IBackendStorageInterface } from "@BabylonBurstClient/AsyncAssets";
import { GetAllZippedFileDatas } from "@BabylonBurstClient/AsyncAssets/Utils/ZipUtils";
import { FileZipData } from "@BabylonBurstClient/AsyncAssets/Framework/StorageInterfaceTypes";


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
        //TODO: Ensure data is downloaded!
        //Get all data for this item
        const backend = (this.storedBackend as AsyncAWSBackend);
        const dataItems:FileZipData[] = [];
        for(var d = 0; d < this.storedItems.length;d++) {
            const dat = this.storedItems[d];
            const data:FileZipData = {name:dat.GetSaveName(),data:await dat.GetData()};
            dataItems.push(data);
        }
        return await backend.StoreZipAtLocation(dataItems,this.getItemLocation(),".zip");
    }
    async DeleteItem(): Promise<boolean> {
        return await (this.storedBackend as AsyncAWSBackend).deleteObject(this.getItemLocation());
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
    }
}
