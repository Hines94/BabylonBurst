import { Component } from "./Component";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { EntityLoader } from "./EntityLoader";
import { PrefabManager } from "./PrefabManager";
import { RegisteredType, Saved } from "./TypeRegister";

export type PrefabPackedType = {
    prefabID:string;
    prefabData:any;
}

@RegisteredType(Prefab,{bEditorRemovable:false})
export class Prefab extends Component {
    @Saved(String,{editorViewOnly:true})
    /** UUID that can be used to easily identify prefab type */
    PrefabIdentifier:string;
    @Saved(Number,{editorViewOnly:true})
    /** entity Index identifier */
    EntityIndex:number;
    @Saved(EntityData,{editorViewOnly:true})
    /** Parent prefabInstance - means this is an active 'instance' of a prefab */
    parent:EntityData;
}

@RegisteredType(PrefabInstance)
export class PrefabInstance extends Component {
    @Saved(String)
    /** UUID of the prefab that has been spawned */
    SpawnedPrefabIdentifier:string;

    @Saved(EntityData)
    /** Entities that are spawned as part of this prefab instance */
    SpawnedPrefabEntities:EntityData[];

    reloadObserver:any;

    constructor(uuid:string = undefined) {
        super();
        this.SpawnedPrefabIdentifier = uuid;
    }

    onComponentAdded(ent:EntityData):void {
        const prefabInst = ent.GetComponent<PrefabInstance>(PrefabInstance);
        prefabInst.refreshPrefabInstance(ent);
    }

    onComponentRemoved(entData: EntityData): void {
        if(this.reloadObserver !== undefined) {
            PrefabManager.GetPrefabManager().onPrefabAdded.remove(this.reloadObserver);
        }
    }

    refreshPrefabInstance(ent:EntityData) {
        //Subscribe for future
        if(this.reloadObserver === undefined) {
            this.reloadObserver = PrefabManager.GetPrefabManager().onPrefabAdded.add((uuid:string)=>{
                if(uuid === this.SpawnedPrefabIdentifier && ent && ent.owningSystem) {
                    this.refreshPrefabInstance(ent);
                }
            })
        }


        //Create new
        const template = PrefabManager.GetPrefabManager().GetPrefabTemplateById(this.SpawnedPrefabIdentifier);
        if(template === undefined) { return; }

        var spawnedEnts:EntityData[] = [];
        if(this.SpawnedPrefabEntities) {
            spawnedEnts = [...this.SpawnedPrefabEntities];
        } 
        this.SpawnedPrefabEntities = [];

        //Make specified entities
        const map:EntityLoadMapping = {};
        const ents = Object.keys(template.entityData);
        for(var i = 0; i < ents.length;i++){
            const entId = parseInt(ents[i]);
            if(i < spawnedEnts.length) {
                const entData = spawnedEnts[i];
                map[entId] = entData;
                //Remove any comps that no longer exist
                for(var c = 0; c < entData.Components.length; c++){
                    const comp = entData.Components[c];
                    const compName = comp.constructor.name;
                    if(!template.DoesEntityHaveComponentByName(entId,compName)) {
                        entData.owningSystem.RemoveComponent(entData,compName);
                    }
                }
            } else {
                map[entId] = ent.owningSystem.AddEntity();
            }
        }
        if(spawnedEnts.length > ents.length) {
            for(var i = ents.length-1;i < spawnedEnts.length;i++) {
                const entData = spawnedEnts[i];
                entData.owningSystem.RemoveEntity(entData);
            }
        }

        const mappings = EntityLoader.LoadTemplateIntoSpecifiedEntities(template, ent.owningSystem,map);
        //Setup so we know which ents we have
        const origEnts = Object.keys(mappings);
        for(var e = 0; e < origEnts.length;e++) {
            this.SpawnedPrefabEntities.push(mappings[origEnts[e]]);   
        }
        //Remove ents that no longer exist
    }
}