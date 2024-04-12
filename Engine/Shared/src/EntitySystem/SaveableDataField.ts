import { ComponentLoadData } from "../Utils/SaveableDataUtils";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { PrefabManager } from "./PrefabManager";
import { FindSavedProperty, registeredTypes, savedProperty } from "./TypeRegister";



export abstract class SaveableDataField {
    static GetSaveableData(entity: EntityData,property:any):any {
        throw new Error("Get Save Data Not Implemented: " + property.constructor.name);
    }

    static LoadSaveableData(data:ComponentLoadData):any {
        throw new Error("Load Save Data Not Implemented");
    }

}