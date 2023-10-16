import { Component } from "./Component";
import { EntityData } from "./EntityData";
import { EntityLoader } from "./EntityLoader";
import { PrefabManager } from "./PrefabManager";
import { RegisteredType, Saved } from "./TypeRegister";

export type PrefabPackedType = {
    prefabID:string;
    prefabData:any;
}

@RegisteredType
export class Prefab extends Component {
    @Saved()
    /** UUID that can be used to easily identify prefab type */
    PrefabIdentifier:string;
    @Saved()
    /** entity Index identifier */
    EntityIndex:number;
    @Saved()
    /** Parent prefabInstance - means this is an active 'instance' of a prefab */
    parent:EntityData;
}

@RegisteredType
export class PrefabInstance extends Component {
    @Saved()
    /** UUID of the prefab that has been spawned */
    SpawnedPrefabIdentifier:string;

    @Saved(EntityData)
    /** Entities that are spawned as part of this prefab instance */
    SpawnedPrefabEntities:EntityData[];

    constructor(uuid:string = undefined) {
        super();
        this.SpawnedPrefabIdentifier = uuid;
    }

    onComponentAdded(ent:EntityData):void {
        const prefabInst = ent.GetComponent<PrefabInstance>(PrefabInstance);
        prefabInst.refreshPrefabInstance(ent);
    }

    refreshPrefabInstance(ent:EntityData) {
        //TODO: Remove old entities / try to re-use id's?
        console.error("TODO: Remove old")
        this.SpawnedPrefabEntities = [];
        //Create new
        const template = PrefabManager.GetPrefabManager().GetPrefabTemplateById(this.SpawnedPrefabIdentifier);
        if(template === undefined) { return; }
        const mappings = EntityLoader.LoadTemplateIntoNewEntities(template, ent.owningSystem);
        //Setup so we know which ents we have
        const origEnts = Object.keys(mappings);
        for(var e = 0; e < origEnts.length;e++) {
            this.SpawnedPrefabEntities.push(mappings[origEnts[e]]);   
        }
    }
}