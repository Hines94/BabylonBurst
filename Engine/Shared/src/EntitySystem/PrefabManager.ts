import { decode } from "@msgpack/msgpack";
import { PrefabPackedType } from "./Prefab";
import { EntityLoader, EntityTemplate } from "./EntityLoader";
import { EntitySystem } from "./EntitySystem";

/** Responsible for loading and managing the prefabs we currently have */
export class PrefabManager {

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

    //TODO: Also with name so we can load from name
    SetupPrefabFromRaw(assetBundle:string,filename:string,data:Uint8Array) {
        const loadData = decode(data) as PrefabPackedType;
        if(loadData.prefabID === undefined) {
            console.error("Invalid prefab type!");
        }
        if(loadData.prefabData === undefined) {
            console.error("Invalid prefab data!");
        }
        this.allPrefabs[loadData.prefabID] = EntityLoader.GetEntityTemplateFromMsgpack(loadData.prefabData);
    }

    LoadPrefabFromId(id:string, entitySystem:EntitySystem) {
        if(this.allPrefabs[id] === undefined) {
            console.error(`Tried to load bad prefab: ${id}`);
            return;
        }
        EntityLoader.LoadTemplateIntoNewEntities(this.allPrefabs[id],entitySystem);
    }
}