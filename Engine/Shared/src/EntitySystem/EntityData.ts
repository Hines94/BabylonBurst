import { Component } from "./Component";
import { SaveableDataField } from "./SaveableDataField";

//Maps entities original->new so we can keep any references etc
export type EntityLoadMapping = {
    [originalId:number]:EntityData;
}


export class EntityData extends SaveableDataField {
    EntityId:number;
    Components:Component[] = [];
    IsValid() {
        return this.EntityId !== undefined;
    }

    CleanEntity() {
        //@ts-ignore
        this.EntityId = undefined;
        //@ts-ignore
        this.Components = undefined;
    }

    GetComponent<T extends Component>(type: { new(): T }): T | undefined {
        for (let i = 0; i < this.Components.length; i++) {
            if (this.Components[i] instanceof type) {
                return this.Components[i] as T;
            }
        }
        return undefined;
    }

    static GetSaveableData(entity: EntityData, comp:Component, propertyName: string, property:any):any {
        if(!property || !property.IsValid()){
            return 0;
        }
        return property.EntityId;
    }

    static LoadSaveableData(entity: EntityData, comp:Component, propertyName: string, property:any, entityMap:EntityLoadMapping):any {
        if(!property || property === 0) {
            return undefined;
        }
        return entityMap[property];
    }

    ____oldbucket___:any;
}