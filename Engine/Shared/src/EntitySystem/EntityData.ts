import { Component } from "./Component";
import { SaveableDataField } from "./SaveableDataField";
import { RegisteredType } from "./TypeRegister";

//Maps entities original->new so we can keep any references etc
export type EntityLoadMapping = {
    [originalId:number]:EntityData;
}

@RegisteredType(EntityData)
export class EntityData extends SaveableDataField {
    EntityId:number;
    Components:{[compName:string]:Component} = {};
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
        return this.Components[type.name] as T;

    }

    GetComponentByName(name:string) : Component {
        return this.Components[name];
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