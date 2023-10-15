import { Component } from "./Component";
import { SaveableDataField } from "./SaveableDataField";
import { RegisteredType } from "./TypeRegister";

//Maps entities original->new so we can keep any references etc
export type EntityLoadMapping = {
    [originalId:number]:EntityData;
}

@RegisteredType
export class EntityData extends SaveableDataField {
    EntityId:number;
    Components:Component[] = [];
    owningSystem:any;
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

    GetComponentByName(name:string) : Component {
        for(var c=0; c < this.Components.length;c++) {
            const comp = this.Components[c];
            if(comp.constructor.name === name) {
                return comp;
            }
        }
        return undefined;
    }

    static GetSaveableData(entity: EntityData,property:any):any {
        if(property === undefined || property === null || !property.IsValid()){
            return 0;
        }
        return property.EntityId;
    }

    static LoadSaveableData(entity: EntityData,property:any, entityMap:EntityLoadMapping):any {
        if(!property || property === 0) {
            return undefined;
        }
        return entityMap[property];
    }

    ____oldbucket___:any;
}