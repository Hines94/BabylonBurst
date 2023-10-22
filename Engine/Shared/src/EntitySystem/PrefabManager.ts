import { decode } from "@msgpack/msgpack";
import { PrefabPackedType } from "./Prefab";
import { EntityLoader, EntityTemplate } from "./EntityLoader";
import { EntitySystem } from "./EntitySystem";
import { GetAllZippedFileDatas, GetZipPath } from "../AsyncAssets/Utils/ZipUtils";
import { AsyncAssetManager } from "../AsyncAssets";
import { Observable } from "@babylonjs/core";

function addPrefabEnd(item:string):string {
    if(item.includes(".Prefab")) {
        return item;
    }
    return item + ".Prefab";
}

/** Responsible for loading and managing the prefabs we currently have */
export class PrefabManager {

    onPrefabAdded = new Observable<string>();

    //TODO: we require backend etc to get all prefabs!
    static GetPrefabManager():PrefabManager {
        if(this.Manager === undefined) {
            new PrefabManager();
        }
        return this.Manager;
    }
    
    private static Manager:PrefabManager;

    constructor() {
        if(PrefabManager.Manager) {
            console.error("Tried to make two prefab managers!");
        }
        PrefabManager.Manager = this;
    }

    allPrefabs:{[id:string]:EntityTemplate} = {};
    prefabBundleNamesToIds:{[bundleName:string]:string} = {};

    async setupAllPrefabs() {
        //Already setup?
        if(Object.keys(this.allPrefabs).length > 0) {
            return;
        }
        const assetManager = AsyncAssetManager.GetAssetManager();
        const allItems = await assetManager.backendStorage.GetAllBackendItems();
        for(let i in allItems) {
            const bundlePath = allItems[i];
            if(!bundlePath.includes("~p~")) {
                continue;
            }
            const data = await assetManager.GetItemAtLocation(bundlePath);
            if(data === undefined) {
                continue;
            }
            //Check through each zipped
            const zippedData = await GetAllZippedFileDatas(data);
            for(let zd in zippedData) {
                const zipped = zippedData[zd];
                if(!zipped.name.includes(".Prefab")) {
                    continue;
                }
                this.SetupPrefabFromRaw(bundlePath,zipped.name,await zipped.entry.arrayBuffer());
            }
        }
    }

    SetupPrefabFromRaw(bundlePath:string,fileName:string,data: ArrayLike<number> | BufferSource) {
        const loadData = decode(data) as PrefabPackedType;
        if(loadData.prefabID === undefined) {
            console.error("Invalid prefab type!");
        }
        if(loadData.prefabData === undefined) {
            console.error("Invalid prefab data!");
        }
        const fullPath = GetZipPath(bundlePath)+"_"+addPrefabEnd(fileName);
        this.prefabBundleNamesToIds[fullPath] = loadData.prefabID;
        this.allPrefabs[loadData.prefabID] = EntityLoader.GetEntityTemplateFromMsgpack(loadData.prefabData);
        console.log("Setup prefab item: " + fullPath)
        this.onPrefabAdded.notifyObservers(loadData.prefabID);
    }

    GetPrefabTemplateById(id:string) {
        return this.allPrefabs[id];
    }

    GetPrefabBundleNameFromId(id:string) {
        const keys = Object.keys(this.prefabBundleNamesToIds);
        for(var i = 0; i < keys.length;i++) {
            if(this.prefabBundleNamesToIds[keys[i]] === id) {
                return keys[i];
            }
        }
        return undefined;
    }

    GetPrefabTemplateByBundleFileName(bundlePath:string,fileName:string) {
        const fullPath = GetZipPath(bundlePath)+"_"+addPrefabEnd(fileName);
        if(this.prefabBundleNamesToIds[fullPath] !== undefined) {
            return this.allPrefabs[this.prefabBundleNamesToIds[fullPath]];
        }
        return undefined;
    }

    LoadPrefabFromIdToNew(id:string, entitySystem:EntitySystem) {
        if(this.allPrefabs[id] === undefined) {
            console.error(`Tried to load bad prefab: ${id}`);
            return;
        }
        EntityLoader.LoadTemplateIntoNewEntities(this.allPrefabs[id],entitySystem);
    }

    LoadPrefabFromIdToExisting(id:string, entitySystem:EntitySystem) {
        if(this.allPrefabs[id] === undefined) {
            console.error(`Tried to load bad prefab: ${id}`);
            return;
        }
        EntityLoader.LoadTemplateIntoExistingEntities(this.allPrefabs[id],entitySystem);
    }
}