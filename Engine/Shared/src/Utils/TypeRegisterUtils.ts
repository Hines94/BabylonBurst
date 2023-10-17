import { Component } from "../EntitySystem/Component";
import { registeredTypes, storedRegisteredType } from "../EntitySystem/TypeRegister";

export function GetAllComponentClassTypes(): storedRegisteredType[] {
    const ret:storedRegisteredType[] = [];
    const classKeys = Object.keys(registeredTypes);
    for(var c = 0; c < classKeys.length;c++) {
        const regTyp = registeredTypes[classKeys[c]];
        if(regTyp.type.prototype instanceof Component) {
            ret.push(regTyp);
        }
    }
    return ret;
}
