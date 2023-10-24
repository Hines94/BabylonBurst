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

export function isTypeAClass(type: any): boolean {
    const builtInConstructors = [
        'Number', 'String', 'Boolean', 'Array', 'Object', 'Function', //... any other built-ins you want to exclude
    ];

    return typeof type === 'function' && 
           !!type.prototype &&
           type.prototype.constructor === type &&
           !builtInConstructors.includes(type.name);
}

export function IsIntArrayType(type:any) {
    return type === Uint8Array || type === Uint16Array || type === Uint32Array;
}

export function IsIntArrayInstance(object:any) {
    return object instanceof Uint8Array || object instanceof Uint16Array || object instanceof  Uint32Array;
}

