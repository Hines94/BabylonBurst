import { decode, encode } from "@msgpack/msgpack";
import { PrefabPackedType } from "./Prefab";
import { EntityLoader, EntityTemplate } from "./EntityLoader";
import { EntitySystem } from "./EntitySystem";
import { GetAllZippedFileDatas, GetZipPath } from "../AsyncAssets/Utils/ZipUtils";
import { AsyncAssetManager } from "../AsyncAssets";
import { Observable } from "@babylonjs/core";
import { Component } from "./Component";
import { v4 as uuidv4 } from "uuid";

function addPrefabEnd(item:string):string {
    if(item.includes(".Prefab")) {
        return item;
    }
    return item + ".Prefab";
}

/** Responsible for loading and managing the prefabs we currently have */
export class PrefabManager {

    static onPrefabAdded = new Observable<string>();

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

    static async setupAllPrefabs() {
        const Manager = this.GetPrefabManager();
        //Already setup?
        if(Object.keys(Manager.allPrefabs).length > 0) {
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
                PrefabManager.SetupPrefabFromRaw(bundlePath,zipped.name,await zipped.entry.arrayBuffer());
            }
        }
    }

    static SetupPrefabFromRaw(bundlePath:string,fileName:string,data: ArrayLike<number> | BufferSource) {
        const Manager = this.GetPrefabManager();
        var loadData:PrefabPackedType;
        try {
            loadData = decode(data) as PrefabPackedType;
        } catch {
            console.error(`Error unpacking prefab data: ${bundlePath} - ${fileName}`);
            return;
        }
        if(loadData.prefabID === undefined) {
            console.error("Invalid prefab type!");
        }
        if(loadData.prefabData === undefined) {
            console.error("Invalid prefab data!");
        }
        const fullPath = GetZipPath(bundlePath)+"_"+addPrefabEnd(fileName);
        Manager.prefabBundleNamesToIds[fullPath] = loadData.prefabID;
        Manager.allPrefabs[loadData.prefabID] = EntityLoader.GetEntityTemplateFromMsgpack(loadData.prefabData);
        console.log("Setup prefab item: " + fullPath)
        PrefabManager.onPrefabAdded.notifyObservers(loadData.prefabID);
    }

    static GetPrefabTemplateById(id:string) {
        const Manager = this.GetPrefabManager();
        return Manager.allPrefabs[id];
    }

    static GetPrefabBundleNameFromId(id:string) {
        const Manager = this.GetPrefabManager();
        const keys = Object.keys(Manager.prefabBundleNamesToIds);
        for(var i = 0; i < keys.length;i++) {
            if(Manager.prefabBundleNamesToIds[keys[i]] === id) {
                return keys[i];
            }
        }
        return undefined;
    }

    static GetComponentFromPrefab<T extends Component>(prefabId:string, entityId:number,comp: { new(): T }):T | undefined {
        const template = PrefabManager.GetPrefabTemplateById(prefabId);
        if(template === undefined) {
            return undefined;
        }
        if(template.DoesEntityExist(entityId) ===  false){
            return undefined;
        }
        return template.GetEntityComponent(entityId,comp,undefined,undefined);
    }

    static GetIdFromBundleFileName(bundlePath:string,fileName:string) {
        const Manager = this.GetPrefabManager();
        const fullPath = GetZipPath(bundlePath)+"_"+addPrefabEnd(fileName);
        return Manager.prefabBundleNamesToIds[fullPath];
    }

    static GetPrefabTemplateByBundleFileName(bundlePath:string,fileName:string) {
        const Manager = this.GetPrefabManager();
        const fullPath = GetZipPath(bundlePath)+"_"+addPrefabEnd(fileName);
        if(Manager.prefabBundleNamesToIds[fullPath] !== undefined) {
            return Manager.allPrefabs[Manager.prefabBundleNamesToIds[fullPath]];
        }
        return undefined;
    }

    static LoadPrefabFromIdToNew(id:string, entitySystem:EntitySystem) {
        const Manager = this.GetPrefabManager();
        if(Manager.allPrefabs[id] === undefined) {
            console.error(`Tried to load bad prefab: ${id}`);
            return;
        }
        return EntityLoader.LoadTemplateIntoNewEntities(Manager.allPrefabs[id],entitySystem);
    }

    static LoadPrefabFromIdToExisting(id:string, entitySystem:EntitySystem) {
        const Manager = this.GetPrefabManager();
        if(Manager.allPrefabs[id] === undefined) {
            console.error(`Tried to load bad prefab: ${id}`);
            return;
        }
        EntityLoader.LoadTemplateIntoExistingEntities(Manager.allPrefabs[id],entitySystem);
    }

    static GenerateNewPrefabSave(data:any,id:string = undefined) {
        const thisId = id === undefined ? uuidv4() : id;
        const thisData = data instanceof Uint8Array ? data : encode(data);
        return encode({
            prefabID: thisId ,
            prefabData: thisData,
        });
    }
}