import { encode } from "@msgpack/msgpack";
import { EntityQuery } from "./EntityQuery";
import { EntitySystem } from "./EntitySystem";
import { Prefab } from "./Prefab";
import { PrefabManager } from "./PrefabManager";
import { SaveableDataField } from "./SaveableDataField";
import { Component } from "./Component";
import { FindSavedProperty, registeredTypes, savedProperties } from "./TypeRegister";
import { EntitySavedTypings, GetCustomSaveData, GetTypingsCompIndex } from "../Utils/SaveableDataUtils";

export class EntitySaver {

    static GetMsgpackForAllEntities(system:EntitySystem, bIgnoreDefaults = false) {
        const allEnts = system.GetEntitiesWithData([],[]);
        return this.GetMsgpackForQuery(allEnts,bIgnoreDefaults);
    }

    /** If ignore defaults then will not waste save data on items the same as default values */
    static GetMsgpackForQuery(query:EntityQuery, bIgnoreDefaults:boolean) : Uint8Array {
        const typings:EntitySavedTypings = [];
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
                data[ent.EntityId][typingsIndex] = GetCustomSaveData(undefined,ent,compObject,bIgnoreDefaults,typings);

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