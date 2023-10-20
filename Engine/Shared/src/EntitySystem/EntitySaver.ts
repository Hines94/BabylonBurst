import { encode } from "@msgpack/msgpack";
import { EntityQuery } from "./EntityQuery";
import { EntitySystem } from "./EntitySystem";
import { Prefab } from "./Prefab";
import { PrefabManager } from "./PrefabManager";
import { SaveableDataField } from "./SaveableDataField";
import { Component } from "./Component";
import { FindSavedProperty, registeredTypes, savedProperties } from "./TypeRegister";

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

    static GetMsgpackForAllEntities(system:EntitySystem, bIgnoreDefaults = false) {
        const allEnts = system.GetEntitiesWithData([],[]);
        return this.GetMsgpackForQuery(allEnts,bIgnoreDefaults);
    }

    static GetMsgpackForQuery(query:EntityQuery, bIgnoreDefaults:boolean) : Uint8Array {
        const typings:EntitySavedTypings = {};
        const data = {};
        query.iterateEntities((ent)=>{
            data[ent.EntityId] = {};
            const prefabComp = ent.GetComponent<Prefab>(Prefab);
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
                var defaultComp = new (registeredTypes[compName].type as any)();

                //Get default from prefab?
                if(prefabComp !== undefined && prefabComp.parent !== undefined) {
                    const attemptPrefab = PrefabManager.GetPrefabManager().GetPrefabTemplateById(prefabComp.PrefabIdentifier);
                    if(attemptPrefab) {
                        const defaultPrefab = attemptPrefab.GetEntityComponentByName(ent.EntityId,compName,undefined,query.owningSystem.GetAllEntities());
                        if(defaultPrefab) {
                            defaultComp = defaultPrefab;
                        }
                    }
                }

                keys.forEach(paramName =>{
                    //Get the metadata about this property (via decorator)
                    const propIdentifier = FindSavedProperty(compName,paramName);
                    //Is the same as default? No need to pack!
                    if(bIgnoreDefaults && defaultComp[paramName] === compObject[paramName]) {
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
                    data[ent.EntityId][typingsIndex][paramIndex] = SaveableDataField.getCustomSaveData(propIdentifier,ent,paramData);
                })

                //Tidy if ignore default and prefab
                if(prefabComp !== undefined && prefabComp.parent !== undefined && Object.keys(data[ent.EntityId][typingsIndex]).length === 0) {
                    delete(data[ent.EntityId][typingsIndex]);
                }
            }
        })
        const finalObject = {
            T:typings,
            C:data
        };
        return encode(finalObject);
    }

}