import { EntityData, EntityLoadMapping } from "./EntityData";
import { FindSavedProperty, registeredTypes, savedProperties, savedProperty } from "./TypeRegister";



export abstract class SaveableDataField {
    static GetSaveableData(entity: EntityData,property:any):any {
        throw new Error("Get Save Data Not Implemented: " + property.constructor.name);
    }

    static LoadSaveableData(entity: EntityData,property:any, entityMap:EntityLoadMapping):any {
        throw new Error("Load Save Data Not Implemented");
    }

    static getCustomSaveData(propIdentifier: savedProperty, entity:EntityData, property: any) {
        //Array?
        if(propIdentifier && Array.isArray(property)) {
            const ret:any[] = [];
            if(property !== undefined && property !== null) {
                for(var i = 0; i < property.length;i++) {
                    ret.push(this.getCustomSaveData(propIdentifier,entity,property[i]));
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
                console.warn(`Property ${propType} is not a registered type and will not load properly. Please use @RegisteredComponent!`);
                return property;
            }
            var ret = {};
            const keys = Object.keys(property);
            for(let k in keys) {
                const key = keys[k];
                const nestPropIdentifier = FindSavedProperty(propType,key);
                if(nestPropIdentifier !== undefined) {
                    ret[key] = this.getCustomSaveData(nestPropIdentifier,entity,property[key]);
                }
            }
            return ret;
        }
        //Regular
        return property;
        
    }

    static loadCustomSaveData(entity:EntityData, entMap:EntityLoadMapping, property: any,compName:string,paramName:string) : any {
        const propIdentifier = FindSavedProperty(compName,paramName);
        //Array case?
        if(Array.isArray(property)) {
            const ret:any[] = [];
            for(var i = 0; i < property.length;i++) {
                ret.push(this.loadCustomSaveData(entity,entMap,property[i],compName,paramName));
            }
            return ret;
        }
        //Custom serializable?
        if (propIdentifier && propIdentifier.type["LoadSaveableData"]) {
            return propIdentifier.type.LoadSaveableData(entity,property,entMap);
        } 
        //Nested object?
        if(propIdentifier && typeof property === "object") {
            const ret = {};
            for(let key in property) {
                ret[key] = this.loadCustomSaveData(entity,entMap,property[key],propIdentifier.type.name,key);
            }
            return ret;
        }

        //Regular
        return property;
    }

}