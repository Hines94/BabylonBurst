import { Component } from "./Component";
import { EntityData } from "./EntityData";
import { EntityLoadMapping } from "./EntityLoader";



export abstract class SaveableDataField {
    static GetSaveableData(entity: EntityData, comp:Component, propertyName: string, property:any):any {
        throw new Error("Get Save Data Not Implemented: " + comp.constructor.name + ": " + propertyName);
    }

    static LoadSaveableData(entity: EntityData, comp:Component, propertyName: string, property:any, entityMap:EntityLoadMapping):any {
        throw new Error("Load Save Data Not Implemented: " + comp.constructor.name + ": " + propertyName);
    }
}