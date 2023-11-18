import { Component } from "./Component";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { EntityLoader } from "./EntityLoader";
import { EntitySystem } from "./EntitySystem";
import { PrefabManager } from "./PrefabManager";
import { TrackedVariable } from "./TrackedVariable";
import { RegisteredType, Saved } from "./TypeRegister";

@RegisteredType(PrefabSpecifier)
export class PrefabSpecifier {
    @Saved(String)
    prefabUUID:string = "";
}

@RegisteredType(SpawnedPrefabBundle)
export class SpawnedPrefabBundle {
    @Saved(EntityData)
    spawnedEntities:EntityData[] = [];
}

export type PrefabPackedType = {
    prefabID:string;
    prefabData:any;
}

@RegisteredType(Prefab,{bEditorRemovable:false,bEditorAddable:false,comment:`Present on all prefab entities. Automatically populated.`})
export class Prefab extends Component {
    @Saved(String,{editorViewOnly:true,comment:`Unique identifier to easily identify which prefab we are looking at without having to show filename/path etc`})
    /** UUID that can be used to easily identify prefab type */
    PrefabIdentifier:string;
    @Saved(Number,{editorViewOnly:true,comment:`The relative index of this entity in our prefab`})
    /** entity Index identifier */
    EntityIndex:number;
    @Saved(EntityData,{editorViewOnly:true,comment:`If not 0 (or undefined) then this prefab has been added/managed from a PrefabInstance`})
    /** Parent prefabInstance - means this is an active 'instance' of a prefab */
    parent:EntityData;
}

@RegisteredType(PrefabInstance,{comment:`A way of spawning/managing prefabs into a scene`})
export class PrefabInstance extends Component {
    @TrackedVariable()
    @Saved(PrefabSpecifier)
    /** UUID of the prefab that has been spawned */
    SpawnedPrefabIdentifier:PrefabSpecifier = new PrefabSpecifier();

    @TrackedVariable()
    @Saved(Number,{comment:"Set this higher to spawn more prefab instances"})
    NumberInstances = 1;

    @Saved(SpawnedPrefabBundle, {editorViewOnly:true,comment:`Entities that have been currently spawned from the specified identifier`})
    /** Entities that are spawned as part of this prefab instance */
    SpawnedPrefabEntities:SpawnedPrefabBundle[] = [];

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
            PrefabManager.onPrefabAdded.remove(this.reloadObserver);
        }
        this.clearSpawnedEntities();
    }

    onComponentChanged(entData: EntityData): void {
        const prefabInst = entData.GetComponent<PrefabInstance>(PrefabInstance);
        prefabInst.refreshPrefabInstance(entData);
    }

    /** Get all spawned entities that were created by this prefab instance */
    GetAllSpawnedInstanceEntities():EntityData[] {
        const ret = [];
        for(var b = 0; b < this.SpawnedPrefabEntities.length;b++) {
            const bucket = this.SpawnedPrefabEntities[b];
            if(bucket === undefined || bucket.spawnedEntities === undefined) {
                continue;
            }
            for(var e = 0; e < bucket.spawnedEntities.length;e++) {
                if(bucket.spawnedEntities[e] && bucket.spawnedEntities[e].IsValid()){
                    ret.push(bucket.spawnedEntities[e]);
                }
            }
        }
        return ret;
    }

    refreshPrefabInstance(ent:EntityData) {
        //Subscribe for future
        if(this.reloadObserver === undefined) {
            this.reloadObserver = PrefabManager.onPrefabAdded.add((uuid:string)=>{
                if(uuid === this.SpawnedPrefabIdentifier.prefabUUID && ent && ent.owningSystem) {
                    this.refreshPrefabInstance(ent);
                }
            })
        }

        const prefabComp = ent.GetComponent(Prefab);
        if(prefabComp && prefabComp.PrefabIdentifier === this.SpawnedPrefabIdentifier.prefabUUID) {
            console.error(`Prefab ${prefabComp.PrefabIdentifier} has itself inside prefab instance! Aborting!`);
            this.clearSpawnedEntities();
            return;
        }


        //Get the template we are attempting to spawn
        const template = PrefabManager.GetPrefabTemplateById(this.SpawnedPrefabIdentifier.prefabUUID);
        if(template === undefined || this.NumberInstances <= 0) { 
            this.clearSpawnedEntities();
            return; 
        }

        //Get record of old bundles and how they were mapped
        const existingBundles = [...this.SpawnedPrefabEntities];
        this.SpawnedPrefabEntities = [];

        if(this.NumberInstances < existingBundles.length) {
            for(var b = this.NumberInstances; b < existingBundles.length;b++) {
                this.DeleteEntityBucket(existingBundles[b]);
            }
        }

        //Create the number of instances we want
        for(var b = 0; b < this.NumberInstances;b++) {
            const entBundle = b < existingBundles.length?existingBundles[b]:undefined;

            var spawnedEnts:EntityData[] = [];
            if(entBundle && entBundle.spawnedEntities) {
                spawnedEnts = [...entBundle.spawnedEntities];
            } 
    
            //Make specified entities
            const map:EntityLoadMapping = {};
            const ents = Object.keys(template.entityData);
            for(var i = 0; i < ents.length;i++){
                const entId = parseInt(ents[i]);
                //Aready existing entity?
                if(i < spawnedEnts.length) {
                    const entData = spawnedEnts[i];
                    map[entId] = entData;
                    //Remove any comps that no longer exist
                    const compKeys = Object.keys(entData.Components);
                    for(var c = 0; c < compKeys.length; c++){
                        const compName = compKeys[c];
                        const comp = entData.Components[compName];
                        if(!template.DoesEntityHaveComponentByName(entId,compName)) {
                            entData.owningSystem.RemoveComponent(entData,compName);
                        }
                    }
                //New entity?
                } else {
                    map[entId] = ent.owningSystem.AddEntity();
                }
            }
            //Remove ents that no longer exist
            if(spawnedEnts.length > ents.length) {
                for(var i = ents.length-1;i < spawnedEnts.length;i++) {
                    const entData = spawnedEnts[i];
                    entData.owningSystem.RemoveEntity(entData);
                }
            }
    
            const mappings = EntityLoader.LoadTemplateIntoSpecifiedEntities(template, ent.owningSystem,map,true);
            
            //Setup so we know which ents we have
            const origEnts = Object.keys(mappings);
            const newBundle = new SpawnedPrefabBundle();
            for(var e = 0; e < origEnts.length;e++) {
                newBundle.spawnedEntities.push(mappings[origEnts[e]]); 
            }
            this.SpawnedPrefabEntities.push(newBundle);
    
            //Setup parent in prefab comps
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

    clearSpawnedEntities() {
        if(!this.SpawnedPrefabEntities || this.SpawnedPrefabEntities.length === 0) {
            return;
        }
        for(var b = 0; b < this.SpawnedPrefabEntities.length;b++) {
            const bucket = this.SpawnedPrefabEntities[b];
            this.DeleteEntityBucket(bucket);
        }
        this.SpawnedPrefabEntities = [];
    }

    private DeleteEntityBucket(bucket: SpawnedPrefabBundle) {
        if (!bucket || bucket.spawnedEntities.length === 0) {
            return;
        }
        for (var e = 0; e < bucket.spawnedEntities.length; e++) {
            const ent = bucket.spawnedEntities[e];
            if (ent && ent.IsValid()) {
                ent.owningSystem.RemoveEntity(ent);
            }
        }
    }
}