import { Component } from "./Component";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { EntityLoader } from "./EntityLoader";
import { EntitySystem } from "./EntitySystem";
import { PrefabManager } from "./PrefabManager";
import { TrackedVariable } from "./TrackedVariable";
import { RegisteredType, Saved } from "./TypeRegister";

@RegisteredType(PrefabSpecifier)
export class PrefabSpecifier {
    prefabUUID:string = "";
}

export type PrefabPackedType = {
    prefabID:string;
    prefabData:any;
}

@RegisteredType(Prefab,{bEditorRemovable:false,bEditorAddable:false})
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
    @TrackedVariable()
    @Saved(PrefabSpecifier)
    /** UUID of the prefab that has been spawned */
    SpawnedPrefabIdentifier:PrefabSpecifier = new PrefabSpecifier();

    @Saved(EntityData, {editorViewOnly:true})
    /** Entities that are spawned as part of this prefab instance */
    SpawnedPrefabEntities:EntityData[] = [];

    reloadObserver:any;

    constructor(uuid:string = undefined) {
        super();
        this.SpawnedPrefabIdentifier.prefabUUID = uuid;
    }

    onComponentAdded(entData:EntityData):void {
        const prefabInst = entData.GetComponent<PrefabInstance>(PrefabInstance);
        prefabInst.refreshPrefabInstance(entData);
    }

    onComponentRemoved(entData: EntityData): void {
        if(this.reloadObserver !== undefined) {
            PrefabManager.GetPrefabManager().onPrefabAdded.remove(this.reloadObserver);
        }
        for(var i = 0; i < this.SpawnedPrefabEntities.length;i++) {
            (entData.owningSystem as EntitySystem).RemoveEntity(this.SpawnedPrefabEntities[i]);
        }
    }

    onComponentChanged(entData: EntityData): void {
        console.log("Prefab instance changed - reloading")
        const prefabInst = entData.GetComponent<PrefabInstance>(PrefabInstance);
        prefabInst.refreshPrefabInstance(entData);
    }

    refreshPrefabInstance(ent:EntityData) {
        //Subscribe for future
        if(this.reloadObserver === undefined) {
            this.reloadObserver = PrefabManager.GetPrefabManager().onPrefabAdded.add((uuid:string)=>{
                if(uuid === this.SpawnedPrefabIdentifier.prefabUUID && ent && ent.owningSystem) {
                    this.refreshPrefabInstance(ent);
                }
            })
        }

        const prefabComp = ent.GetComponent(Prefab);
        if(prefabComp && prefabComp.PrefabIdentifier === this.SpawnedPrefabIdentifier.prefabUUID) {
            console.error(`Prefab ${prefabComp.PrefabIdentifier} has itself inside prefab instance! Aborting!`);
            return;
        }


        //Create new
        const template = PrefabManager.GetPrefabManager().GetPrefabTemplateById(this.SpawnedPrefabIdentifier.prefabUUID);
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
            console.log("Added spawned entity!")  
        }
        //Remove ents that no longer exist

        //Setup parent
        const loadedEnts = Object.keys(mappings);
        for(var i = 0; i < loadedEnts.length;i++) {
            const origEntId = loadedEnts[i];
            const entData = mappings[origEntId] as EntityData;
            const prefab = entData.GetComponent<Prefab>(Prefab);
            if(prefab === undefined) {
                console.error(`Prefab instance ent has no prefab comp! ${origEntId}`);
            } else {
                prefab.parent = ent;
            }
        }
    }
}