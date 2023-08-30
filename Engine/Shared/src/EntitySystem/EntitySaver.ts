import { encode } from "@msgpack/msgpack";
import { Component, FindSavedProperty, registeredComponents, savedProperties } from "./Component";
import { EntityQuery } from "./EntityQuery";
import { EntitySystem } from "./EntitySystem";

export type EntitySavedTypings = {
    [comps:string]: string[];
};

export function GetTypingsCompIndex(comp:string,typings:EntitySavedTypings):number {
    const keys = Object.keys(typings);
    for(var i = 0; i < keys.length;i++){
        if(keys[i]===comp){
            return i;
        }
    }
    return -1;
}

export function GetTypingsParamIndex(comp:string,param:string,typings:EntitySavedTypings):number {
    const keys = typings[comp];
    for(var i = 0; i < keys.length;i++){
        if(keys[i]===param){
            return i;
        }
    }
    return -1;
}

export class EntitySaver {

    static GetMsgpackForAllEntities(system:EntitySystem) {
        const allEnts = system.GetEntitiesWithData([],[]);
        return this.GetMsgpackForQuery(allEnts);
    }

    static GetMsgpackForQuery(query:EntityQuery) : Uint8Array {
        const typings:EntitySavedTypings = {};
        const data = {};
        query.iterateEntities((ent)=>{
            data[ent.EntityId] = {};
            for(var c = 0; c < ent.Components.length;c++){
                //Get data and check if saved
                const compObject = ent.Components[c];
                const compName = Component.GetComponentName(compObject);
                if(!savedProperties[compName]){
                    continue;
                }

                if(!typings[compName]) {
                    typings[compName] = [];
                }
                const typingsIndex = GetTypingsCompIndex(compName,typings);
                data[ent.EntityId][typingsIndex] = {};
                const keys = Object.keys(compObject);

                //Get default component to check against
                const defaultComp = new (registeredComponents[compName] as any)();
                //TODO: Get default from prefab too

                keys.forEach(paramName =>{
                    //Get the metadata about this property (via decorator)
                    const propIdentifier = FindSavedProperty(compName,paramName);
                    //Is the same as default? No need to pack!
                    if(defaultComp[paramName] === compObject[paramName]) {
                        return;
                    }
                    //Is saved?
                    if(!propIdentifier){
                        return;
                    }
                    if(!typings[compName].includes(paramName)){
                        typings[compName].push(paramName);
                    }

                    const paramIndex = GetTypingsParamIndex(compName,paramName,typings);
                    var paramData = compObject[paramName];
                    if(propIdentifier.type["GetSaveableData"]) {
                        paramData = propIdentifier.type.GetSaveableData(ent,compObject,paramName,paramData);
                    }
                    data[ent.EntityId][typingsIndex][paramIndex] = paramData; 
                })
            }
        })
        const finalObject = {
            T:typings,
            C:data
        };
        return encode(finalObject);
    }

}