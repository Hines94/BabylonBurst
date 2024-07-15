import { Component } from "./Component";
import { EntityBucket } from "./EntityBucket";
import { EntityData } from "./EntityData";
import { EntitySystem } from "./EntitySystem";

export class EntityQuery {
    owningSystem:EntitySystem;
    includeComponents:any[] = [];
    data:EntityBucket[];
    filters:((ent:EntityData,query:EntityQuery)=>boolean)[] = [];

    constructor(data:EntityBucket[]){
        this.data = data;
    }

    GetNumEntities():number {
        var n = 0;
        this.iterateEntities((e:EntityData) => {n++});
        return n;
    }

    GetEntitiesArray(): EntityData[] {
        const ret:EntityData[] = [];
        this.iterateEntities(e=>{
            ret.push(e);
        })
        return ret;
    }

    GetSingleton() : EntityData | undefined {
        if(this.GetNumEntities() != 1) return undefined;
        return this.GetEntitiesArray()[0];
    }
    
    /** All included types have been changed? */
    AddChanged_ALL_Filter() {
        this.filters.push((ent:EntityData,filter:EntityQuery) => {
            for(var i = 0; i < filter.includeComponents.length;i++) {
                if(filter.owningSystem.IsChangedComponent(ent,filter.includeComponents[i]) === false){ 
                    return false;
                }
            }
            return true;
        })
    }

    /** Any included component type has been changed? */
    AddChanged_ANY_Filter() {
        this.filters.push((ent:EntityData,filter:EntityQuery) => {
            for(var i = 0; i < filter.includeComponents.length;i++) {
                if(filter.owningSystem.IsChangedComponent(ent,filter.includeComponents[i]) === true){ 
                    return true;
                }
            }
            return false;
        })
    }

    iterateEntities(callback: (entity: EntityData) => void) {
        const filters = this.filters;
        for (let bucket of this.data) {
            for (let entityId in bucket.ContainedEntities) {
                if (bucket.ContainedEntities.hasOwnProperty(entityId)) {
                    const entity = bucket.ContainedEntities[entityId];
                    var filterFail = false;
                    for(let filter of filters) {
                        if(filter(entity,this) === false) {
                            filterFail = true;
                            break;
                        }
                    }
                    if(!filterFail) {
                        callback(entity);
                    }
                }
            }
        }
    }

    FindEntity(entId:number) {
        for (let bucket of this.data) {
            for (let entityId in bucket.ContainedEntities) {
                const entity = bucket.ContainedEntities[entityId];
                if(entity.EntityId === entId) {
                    return entity;
                }
            }
        }
        return undefined;
    }
}