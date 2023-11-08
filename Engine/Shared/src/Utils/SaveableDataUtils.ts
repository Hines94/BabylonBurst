import { Component } from "../EntitySystem/Component";
import { EntityData, EntityLoadMapping } from "../EntitySystem/EntityData";
import { Prefab } from "../EntitySystem/Prefab";
import { PrefabManager } from "../EntitySystem/PrefabManager";
import { proxyCallbackSymbol } from "../EntitySystem/TrackedVariable";
import { FindSavedProperty, registeredTypes, savedProperty, storedRegisteredType } from "../EntitySystem/TypeRegister";
import { DeepEquals } from "./HTMLUtils";
import { GetParentClassesOfInstance, IsIntArrayInstance } from "./TypeRegisterUtils";

export type SavedCompTyping = {
    compName:string;
    compParams:string[];
}

export type EntitySavedTypings = SavedCompTyping[];

const customTypeId = "_T_";


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
    console.warn("Could not find param index for " + param + " in " + comp)
    return undefined;
}


export function GetTypingsParamName(comp:string,param:number,typings:EntitySavedTypings) : string {
    for(var t = 0; t < typings.length;t++) {
        if(typings[t].compName !== comp) {
            continue;
        }
        if(typings[t].compParams.length <= param) {
            console.error(`No param type for ${param} for comp ${comp}`);
            return undefined;
        }
        return typings[t].compParams[param];
    }
    return undefined;
}

export function GetCustomSaveData(propIdentifier: savedProperty, entity:EntityData, property: any, bIgnoreDefaults:boolean, typings:EntitySavedTypings) {
    if(entity === undefined || entity === null) {
        console.warn(`Get save data got null entity`);
        return;
    }
    
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
    } else if(typeof property === "object" && !IsIntArrayInstance(property)) {

        //Check is valid type to be saved
        const propertyTypeName = property.constructor.name;
        const registeredType = registeredTypes[propertyTypeName];
        if(registeredType === undefined) {
            console.warn(`Property ${propIdentifier.name} is not a registered type (${propertyTypeName}) and will not load properly. Please use @RegisteredComponent!`);
            return property;
        }

        //Get default comp to compare against
        var defaultComp = undefined;
        if(bIgnoreDefaults) {
            defaultComp = GetDefaultComponent(registeredType, entity);
        }

        //If this is subtype we must get the parents items too!
        const parentTypes:storedRegisteredType[] = []; 
        GetParentClassesOfInstance(property).forEach((v)=>{
            if(v.name === Component.name) {
                return;
            }
            const parentStored = registeredTypes[v.name];
            if(parentStored === undefined){
                console.warn(`Type: ${v.name} not @RegisteredType. ${propertyTypeName} will not save correctly!`);
                return;
            }
            parentTypes.push(parentStored);
        })

        var ret = {};
        const keys = Object.keys(property);
        for(let k in keys) {
            const key = keys[k].replace("___CUSTOMTYPECHECKED___","");
            if(key === "___proxyCallbackSymbol___") {
                continue;
            }

            //Try get property identifier from saved types
            var nestPropIdentifier:savedProperty = undefined;
            for(var p = parentTypes.length-1; p >= 0;p--) { //Backwards from more specific to less
                if(nestPropIdentifier !== undefined) {
                    continue;
                }
                nestPropIdentifier = FindSavedProperty(parentTypes[p].type.name,key);
            }

            if(nestPropIdentifier !== undefined) {
                //Ignore defaults
                if(bIgnoreDefaults && TwoPropertiesAreIdentical(defaultComp[key],property[key])) {
                    continue;
                }
                const typeIndex = GetTypingsParamIndex(propertyTypeName,key,typings);
                ret[typeIndex] = GetCustomSaveData(nestPropIdentifier,entity,property[key],bIgnoreDefaults,typings);
            }
        }

        //Type is not the same as parent? (Could be a subclass etc)
        if(propIdentifier !== undefined && propIdentifier.type !== registeredType.type) {
            if(property instanceof propIdentifier.type === false) {
                console.warn(`Saved property ${propIdentifier.name} is of type ${propertyTypeName} which is not a valid as a subtype of ${propIdentifier.type.name}. May not load correctly!`)
            }
            ret[customTypeId] = propertyTypeName;
        }
        return ret;
    }
    //Regular
    return property;
    
}

function TwoPropertiesAreIdentical(propA:any,propB:any) {
    return propA === propB || 
        DeepEquals(propA,propB,(k)=>{
            return k.filter(key=>{return key !== proxyCallbackSymbol; })
        }); 
}

function GetDefaultComponent(registeredType: storedRegisteredType, entity: EntityData) {
    var defaultComp = new (registeredType.type as any)();
    const prefabComp = entity.GetComponent(Prefab);
    //Get default from prefab?
    if (prefabComp !== undefined && prefabComp.parent !== undefined) {
        const attemptPrefab = PrefabManager.GetPrefabTemplateById(prefabComp.PrefabIdentifier);
        if (attemptPrefab) {
            const defaultPrefab = attemptPrefab.GetEntityComponentByName(entity.EntityId, registeredType.type.name, undefined, entity.owningSystem.GetAllEntities());
            if (defaultPrefab) {
                defaultComp = defaultPrefab;
            }
        }
    }
    return defaultComp;
}

export function LoadCustomSaveData(entity:EntityData, entMap:EntityLoadMapping, property: any,compName:string,paramName:string, typings:EntitySavedTypings, bPreserveNonDefaults) : any {
    //Try get the appropriate type to load in
    var loadSpecification:savedProperty | storedRegisteredType | undefined = undefined;
    if(property[customTypeId] !== undefined){ 
        //Custom? (Eg subtype)
        loadSpecification = registeredTypes[property[customTypeId]];
    } else {
        loadSpecification = FindSavedProperty(compName,paramName);
    }

    //Try to get the type to load this var as from our spec
    var loadType = loadSpecification !== undefined ? loadSpecification.type : undefined;

    //Array case?
    if(Array.isArray(property)) {
        const ret:any[] = [];
        for(var i = 0; i < property.length;i++) {
            ret.push(LoadCustomSaveData(entity,entMap,property[i],compName,paramName,typings,bPreserveNonDefaults));
        }
        return ret;
    }
    //Custom serializable?
    if (loadType && loadType["LoadSaveableData"]) {
        return loadType.LoadSaveableData(entity,property,entMap);
    } 
    //Nested object?
    if(loadType && typeof property === "object" && !IsIntArrayInstance(property)) {
        const newProp = new loadType();
        var parentTypes = GetParentClassesOfInstance(newProp);
        const keys = Object.keys(property);

        var defaultComp = undefined;
        if(bPreserveNonDefaults) {
            defaultComp = GetDefaultComponent(loadType,entity);
        }
        
        for(var k = 0; k < keys.length;k++) {
            //Get basic info on parameter to load in
            const paramIndex = parseInt(keys[k]);
            const keyName = GetTypingsParamName(loadType.name,paramIndex,typings);
            if(keyName === undefined) {
                continue;
            }

            //If in parent type then we may actually require "Parent" type name to get saved property
            var componentLoadFromType = loadType.name;
            for(var p = parentTypes.length-1; p >= 0;p--) {
                const parentTypeName = parentTypes[p].name;
                var foundProp = FindSavedProperty(parentTypeName,keyName);
                if(foundProp) {
                    componentLoadFromType = parentTypeName;
                    break;
                }
            }
            //Load in this property into the object
            const loadedData = LoadCustomSaveData(entity,entMap,property[paramIndex],componentLoadFromType,keyName,typings,bPreserveNonDefaults);
            if(!bPreserveNonDefaults || !TwoPropertiesAreIdentical(defaultComp[keyName],loadedData)) {
                newProp[keyName] = loadedData;
            }

        }
        return newProp;
    }

    //Regular
    return property;
}