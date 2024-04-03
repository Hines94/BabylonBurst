import { Observable } from "@babylonjs/core";
import { ArraysContainEqualItems } from "../Utils/ArrayUtils";
import { Component } from "./Component";
import { EntityBucket } from "./EntityBucket";
import { EntityData } from "./EntityData"
import { EntityQuery } from "./EntityQuery";
import { registeredTypes } from "./TypeRegister";
import { DeepSetupCallback } from "./TrackedVariable";

export type ComponentNotify = {
    ent:EntityData;
    comp:Component;
}

export class EntitySystem {
    private SpawnedEntities:number = 0;
    private AllEntities:{[entId:number]:EntityData} = {};
    private EntityBuckets:EntityBucket[] = [];
    private ChangedComponents:{[enId:number]:string[]} = {};

    /** When an entity created this will fire */
    onEntityCreatedEv = new Observable<number>();
    /** When an entity removed from the system this will fire */
    onEntityRemovedEv = new Observable<number>();
    /** When a component added to an entity this will fire. WARNING: Can be fired before a prefab fully loaded! */
    onComponentAddedEv = new Observable<ComponentNotify>();
    /** When tracked variables are changed this will fire. Also called on component added at end of frame. */
    onComponentChangedEv = new Observable<ComponentNotify>();

    /** Efficient way to listen for events regarding a component type */
    private specificComponentChangedEvents:{[compName:string]:Observable<ComponentNotify>} = {};
    /** Efficient way to listen for changes to a specific component type  */
    RegisterSpecificComponentChangeNotify(comp:typeof Component | string, callback:(data:ComponentNotify)=>void) {
        this.RegisterSpecificComponentEvent(comp,this.specificComponentChangedEvents,callback);
    }

    /** Efficient way to listen for removed comps regarding a component type */
    private specificComponentRemovedEvents:{[compName:string]:Observable<ComponentNotify>} = {};
    /** Efficient way to listen for removed comps of a specific component type  */
    RegisterSpecificComponentRemoveNotify(comp:typeof Component | string, callback:(data:ComponentNotify)=>void) {
        this.RegisterSpecificComponentEvent(comp,this.specificComponentRemovedEvents,callback);
    }

    AddEntity(): EntityData {
        this.SpawnedEntities++;
        return this.CreateEntity(this.SpawnedEntities);
    }

    GetAllEntities() :{[entId:number]:EntityData} {
        return this.AllEntities;
    }

    EnsureEntity(entId:number) : EntityData {
        if(this.EntityExists(entId)){
            return this.GetEntityData(entId);
        }
        if(entId > this.SpawnedEntities) {
            this.SpawnedEntities = entId;
        }
        return this.CreateEntity(entId);
    }

    EntityExists(entId:number) : boolean {
        return this.AllEntities[entId] !== undefined;
    }

    GetEntityData(entId:number) : EntityData {
        return this.AllEntities[entId];
    }

    ResetSystem() {
        this.GetEntitiesWithData([],[]).iterateEntities((e)=>{
            this.RemoveEntity(e);
        })
        this.SpawnedEntities = 0;
        this.AllEntities = {};
        this.EntityBuckets = [];
        this.ChangedComponents = {};
    }

    RemoveComponent(en:number | EntityData,comp:typeof Component | string) {
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            return;
        }
        
        var component:Component;
        if(typeof comp === "string") {
            component = entData.GetComponentByName(comp);
        } else {
            component = entData.GetComponent(comp);
        }

        if(!component) {
            return;
        }

        //Events
        component.onComponentRemoved();
        if(this.specificComponentRemovedEvents[component.constructor.name]) {
            this.specificComponentRemovedEvents[component.constructor.name].notifyObservers({ent:entData,comp:component});
        }

        component.entityOwner = undefined;
        entData.Components[component.constructor.name] = undefined;
        delete(entData.Components[component.constructor.name])
        const newBucket = this.FindMakeBucket(entData.Components);
        newBucket.ChangeEntityToThisBucket(entData);
    }

    RemoveEntity(en:number | EntityData) {
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            console.warn("Tried to remove invalid ent: " + en);
            return;
        }
        const entId = this.getEntId(en);
        //Remove all components
        const compKeys = Object.keys(entData.Components);
        compKeys.forEach((ck)=> {
            const comp = entData.Components[ck];
            comp.onComponentRemoved();
            comp.entityOwner = undefined;
        });
        EntityBucket.RemoveEntityFromAnyBuckets(entData);
        delete(this.AllEntities[entData.EntityId]);
        entData.CleanEntity();
        this.onEntityRemovedEv.notifyObservers(entId);
    }

    GetEntitiesWithData(includeComps:typeof Component[],excludeComps:typeof Component[]): EntityQuery {
        //Setup
        const includeNames:string[] = [];
        includeComps.forEach(inc=>{
            includeNames.push(inc.name);
        })
        const excludeNames:string[] = [];
        excludeComps.forEach(exc=>{
            excludeNames.push(exc.name);
        })
        //Compare buckets
        const possibleBuckets:EntityBucket[] = [];
        this.EntityBuckets.forEach(b=>{
            for(var n = 0; n < includeNames.length;n++) {
                if(!b.SetComponents.includes(includeNames[n])) {
                    return;
                }
            }
            for(var n = 0; n < excludeNames.length;n++) {
                if(b.SetComponents.includes(excludeNames[n])) {
                    return;
                }
            }
            possibleBuckets.push(b);
        })

        const query = new EntityQuery(possibleBuckets);
        query.owningSystem =this;
        query.includeComponents = includeComps;
        return query;
    }

    AddSetComponentToEntity(en:number | EntityData, comp:Component, bCallAdded = true) : boolean{
        const entData = this.getEntData(en);
        if(!entData.IsValid()) {
            return false;
        }
        const regType = registeredTypes[comp.constructor.name];
        if(!regType) {
            console.error(`Tried to add component ${comp.constructor.name} but it hasn't been registered with @RegisteredType!`);
            return false;
        }

        for(var r = 0;r<regType.options.RequiredComponents.length;r++) {
            const type = regType.options.RequiredComponents[r];
            if(!type) {
                continue;
            }
            if(entData.GetComponent(type as any)) {
                continue;
            }
            const requiredComp = new type();
            if(!this.AddSetComponentToEntity(entData,requiredComp,bCallAdded)) {
                console.error(`could not add required default component ${requiredComp.constructor.name} for ${comp.constructor.name}`)
                return false;
            }
        }

        DeepSetupCallback(comp,()=>{
            this.SetChangedComponent(en,comp);
        });
        entData.Components[comp.constructor.name] = comp;
        const newBucket = this.FindMakeBucket(entData.Components);
        newBucket.ChangeEntityToThisBucket(entData);

        if(bCallAdded) {
            comp.entityOwner = entData;
            comp.onComponentAdded();
            this.SetChangedComponent(entData,comp);
            this.onComponentAddedEv.notifyObservers({ent:entData,comp:comp});
        }

        return true;
    }

    ResetChangedComponents() {
        for(let ent in this.ChangedComponents) {
            const entId = parseInt(ent);
            const comps = this.ChangedComponents[entId];
            const data = this.getEntData(entId);
            if(data === undefined) {
                continue;
            }
            for(var c = 0; c < comps.length;c++) {
                const comp = comps[c];
                const component = data.GetComponentByName(comp);
                if(component === undefined){
                    continue;
                }
                component.onComponentChanged();
                component.componentChanged.notifyObservers(component);
                this.onComponentChangedEv.notifyObservers({ent:data,comp:component});
                if(this.specificComponentChangedEvents[component.constructor.name]) {
                    this.specificComponentChangedEvents[component.constructor.name].notifyObservers({ent:data,comp:component});
                }
            }
        }
        this.ChangedComponents = {};
    }

    IsChangedComponent(en:number | EntityData, comp:typeof Component) {
        const entId = this.getEntId(en);
        if(!entId) {
            return false;
        }
        if(!this.ChangedComponents[entId]) {
            return false;
        }
        return this.ChangedComponents[entId].includes(comp.prototype.constructor.name);
    }

    SetChangedComponent(en:number | EntityData, comp:Component) {
        const entId = this.getEntId(en);
        if(!entId) {
            return;
        }
        if(!this.ChangedComponents[entId]) {
            this.ChangedComponents[entId] = [];
        }

        const name = comp.constructor.name;
        if(!this.ChangedComponents[entId].includes(name)) {
            this.ChangedComponents[entId].push(name);
        }
        comp.onInstantComponentChanged();
    }

    /** NOT RECOMMENDED FOR ANYTHING NETWORKED! Good for changing about local prefabs etc. */
    AddEntityAtAnyEmptySlot() : EntityData {
        for(var i = 1; i < this.SpawnedEntities+10;i++) {
            if(this.getEntData(i) === undefined) {
                if(i > this.SpawnedEntities) {
                    this.SpawnedEntities=i;
                }
                return this.CreateEntity(i);
            }
        }
        return undefined;
    }
    
    private CreateEntity(entId:number):EntityData {
        const newEnt = new EntityData();
        newEnt.EntityId = entId;
        this.AllEntities[entId] = newEnt;
        const bucket = this.FindMakeBucket({});
        bucket.ChangeEntityToThisBucket(newEnt);
        this.onEntityCreatedEv.notifyObservers(entId);
        newEnt.owningSystem = this;
        return newEnt;
    }

    private FindMakeBucket(comps:{[compName:string]:Component}):EntityBucket {
        const compNames:string[] = Object.keys(comps);
        
        //Existing bucket?
        for(var b = 0; b < this.EntityBuckets.length;b++) {
            if(ArraysContainEqualItems(this.EntityBuckets[b].SetComponents,compNames)) {
                return this.EntityBuckets[b];
            }
        }
        
        //New bucket
        const newBucket = new EntityBucket();
        newBucket.SetComponents = compNames;
        this.EntityBuckets.push(newBucket);

        return newBucket;
    }

    private getEntData(ent:number | EntityData) :EntityData {
        if (typeof ent === "number") {
            if(!this.EntityExists(ent)) {
                return undefined;
            }
            return this.GetEntityData(ent);
        } else {
            return ent;
        }
    }

    
    private getEntId(ent:number | EntityData) : number {
        if(ent === undefined) {
            return undefined;
        }
        if (typeof ent === "number") {
            return ent;
        } else {
            return ent.EntityId;
        }
    }

    private RegisterSpecificComponentEvent(comp:typeof Component | string,events:{[compName:string]:Observable<ComponentNotify>},callback:(data:ComponentNotify)=>void) {
        var component = typeof comp === "string" ? comp : comp.name;
        if(events[component] === undefined) {
            events[component] = new Observable<ComponentNotify>();
        }
        events[component].add(callback)
    }

}