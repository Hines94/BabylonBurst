import { EntityData, EntityLoadMapping } from "../EntitySystem/EntityData";
import { Prefab } from "../EntitySystem/Prefab";
import { PrefabManager } from "../EntitySystem/PrefabManager";
import { FindSavedProperty, registeredTypes, savedProperty } from "../EntitySystem/TypeRegister";

export type SavedCompTyping = {
    compName:string;
    compParams:string[];
}

export type EntitySavedTypings = SavedCompTyping[];


export function GetTypingsCompIndex(comp:string,typings:EntitySavedTypings, bCreateNew = true):number {
    for(var i = 0; i < typings.length;i++){
        if(typings[i].compName===comp){
            return i;
        }
    }
    if(bCreateNew) {
        typings.push({compName:comp,compParams:[]});
        return typings.length-1;
    }
    console.error("could not find comp index for " + comp);
    return undefined;
}

export function GetTypingsParamIndex(comp:string,param:string,typings:EntitySavedTypings, bCreateNew = true):number {
    const compIndex = GetTypingsCompIndex(comp,typings);
    if(compIndex === undefined) {
        return undefined;
    }
    for(var k = 0; k < typings[compIndex].compParams.length;k++) {
        const key = typings[compIndex].compParams[k];
        if(key === param) {
            return k;
        }
    }
    if(bCreateNew) {
        typings[compIndex].compParams.push(param);
        return typings[compIndex].compParams.length-1;
    }
    console.log("Could not find param index for " + param + " in " + comp)
    return undefined;
}


export function GetTypingsParamName(comp:string,param:number,typings:EntitySavedTypings) : string {
    for(var t = 0; t < typings.length;t++) {
        if(typings[t].compName !== comp) {
            continue;
        }
        if(typings[t].compParams.length <= param) {
            console.error("No param type for " + param + " for comp " + compName);
            return undefined;
        }
        return typings[t].compParams[param];
    }
    return undefined;
}



export function GetCustomSaveData(propIdentifier: savedProperty, entity:EntityData, property: any, bIgnoreDefaults:boolean, typings:EntitySavedTypings) {
    //Array?
    if(propIdentifier && Array.isArray(property)) {
        const ret:any[] = [];
        if(property !== undefined && property !== null) {
            for(var i = 0; i < property.length;i++) {
                ret.push(GetCustomSaveData(propIdentifier,entity,property[i],bIgnoreDefaults,typings));
            }
        }
        return ret;
    //Custom saveable?
    } else if (propIdentifier && propIdentifier.type["GetSaveableData"]) {
        return propIdentifier.type.GetSaveableData(entity,property);
    //Nested object?
    } else if(typeof property === "object") {
        const propType = property.constructor.name;
        if(registeredTypes[propType] === undefined) {
            console.warn(`Property ${propIdentifier.name} is not a registered type (${propType}) and will not load properly. Please use @RegisteredComponent!`);
            return property;
        }

        const prefabComp = entity.GetComponent(Prefab);
        //Get default component to check against
        var defaultComp = new (registeredTypes[propType].type as any)();
        //Get default from prefab?
        if(prefabComp !== undefined && prefabComp.parent !== undefined) {
            const attemptPrefab = PrefabManager.GetPrefabManager().GetPrefabTemplateById(prefabComp.PrefabIdentifier);
            if(attemptPrefab) {
                const defaultPrefab = attemptPrefab.GetEntityComponentByName(entity.EntityId,propType,undefined,entity.owningSystem.GetAllEntities());
                if(defaultPrefab) {
                    defaultComp = defaultPrefab;
                }
            }
        }

        var ret = {};
        const keys = Object.keys(property);
        for(let k in keys) {
            const key = keys[k].replace("___CUSTOMTYPECHECKED___","");
            if(key === "___proxyCallbackSymbol___") {
                continue;
            }
            const nestPropIdentifier = FindSavedProperty(propType,key);
            if(nestPropIdentifier !== undefined) {
                //Ignore defaults
                if(bIgnoreDefaults && defaultComp[key] === property[key]) {
                    continue;
                }
                const typeIndex = GetTypingsParamIndex(propType,key,typings);
                ret[typeIndex] = GetCustomSaveData(nestPropIdentifier,entity,property[key],bIgnoreDefaults,typings);
            }
        }
        return ret;
    }
    //Regular
    return property;
    
}

export function LoadCustomSaveData(entity:EntityData, entMap:EntityLoadMapping, property: any,compName:string,paramName:string, typings:EntitySavedTypings) : any {
    const propIdentifier = FindSavedProperty(compName,paramName);
    //Array case?
    if(Array.isArray(property)) {
        const ret:any[] = [];
        for(var i = 0; i < property.length;i++) {
            ret.push(LoadCustomSaveData(entity,entMap,property[i],compName,paramName,typings));
        }
        return ret;
    }
    //Custom serializable?
    if (propIdentifier && propIdentifier.type["LoadSaveableData"]) {
        return propIdentifier.type.LoadSaveableData(entity,property,entMap);
    } 
    //Nested object?
    if(propIdentifier && typeof property === "object") {
        const propType = propIdentifier.type;
        const newProp = new propType();
        const keys = Object.keys(property);
        for(var k = 0; k < keys.length;k++) {
            const paramIndex = parseInt(keys[k]);
            const keyName = GetTypingsParamName(propType.name,paramIndex,typings);
            if(keyName === undefined) {
                continue;
            }
            newProp[keyName] = LoadCustomSaveData(entity,entMap,property[paramIndex],propIdentifier.type.name,keyName,typings);
        }
        return newProp;
    }

    //Regular
    return property;
}