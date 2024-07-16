import 'reflect-metadata';
import { Component } from './Component';
import { DebugMode, environmentVaraibleTracker } from '../Utils/EnvironmentVariableTracker';
import { GetParentClassesOfInstance, IsEnumType } from '../Utils/TypeRegisterUtils';

/** So we can hide a variable and use a getter/setter instead */
export function GetDescriptorHideVarName(propertyKey:string) {
    return `___CUSTOMTYPECHECKED___${propertyKey}`
}

export type savedProperty = {
    name:string;
    type:any;
    options:SavedPropertyOptions;
}

export const FindSavedProperty = (compName: string, propName: string) => {
    const mainClassFind = savedProperties[compName]?.find(prop => prop.name === propName);
    if(mainClassFind !== undefined){
        return mainClassFind;
    }

    const parentTypes = GetParentCompsForRegisteredType(compName);
    for(var p = 0; p < parentTypes.length;p++) {
        if(parentTypes[p] === undefined || parentTypes[p].type === undefined) {
            continue;
        }
        const parentFound = savedProperties[parentTypes[p].type.name]?.find(prop => prop.name === propName);
        if(parentFound !== undefined) {
            return parentFound;
        }
    }
    
    return undefined;
}

export function GetAllSavedProperties(compName:string) {
    var ret:savedProperty[] = [];
    if(savedProperties[compName]) {
        ret = ret.concat(savedProperties[compName]);
    }
    const parentTypes = GetParentCompsForRegisteredType(compName);
    for(var p =0; p < parentTypes.length;p++) {
        if(parentTypes[p] === undefined || parentTypes[p].type === undefined) {
            continue;
        }
        if(parentTypes[p].type.name === compName) {
            continue;
        }
        if(savedProperties[parentTypes[p].type.name]) {
            ret = ret.concat(savedProperties[parentTypes[p].type.name]);
        }
    }
    return ret;
}

const savedProperties:{[compName:string]:savedProperty[]} = {};

export class SavedPropertyOptions {
    isNetworked = true;
    editorViewOnly = false;
    comment = "";
}


const parentedTypes:{[compName:string]:storedRegisteredType[]} = {};
/** Includes actual class itself */
export function GetParentCompsForRegisteredType(compName:string) : storedRegisteredType[] {
    const regType = registeredTypes[compName];
    if(regType === undefined) {
        return [];
    }
    if(parentedTypes[compName]) {
        return parentedTypes[compName];
    }
    //@ts-ignore
    const instance = new registeredTypes[compName].type();
    parentedTypes[compName] = [registeredTypes[compName]];
    const parentTypes = GetParentClassesOfInstance(instance);
    for(var t = 0; t < parentTypes.length;t++) {
        const regType = registeredTypes[parentTypes[t].name];
        if(!parentedTypes[compName].includes(regType)) {
            parentedTypes[compName].push(regType);
        }
    }
    return parentedTypes[compName];
}

/** Define a property as 'saved'. Property type must be primitive or a registered type. */
export function Saved(type?: Function | { [key: string]: number | string },options:Partial<SavedPropertyOptions> = {}) {
    return function (target: any, propertyKey: string) {
        const compName = target.constructor.name;
        const propertyType = type;


        if(type === undefined) {
            console.error(`Type not set for  ${propertyKey} in comp ${compName} in  @Saved(TYPE). Please ensure that the typing is correct`);
        } else if(typeof type !== "function" && !IsEnumType(type)) {
            console.error(`Type not valid for  ${propertyKey} in comp ${compName} in  @Saved(TYPE). Please ensure that the typing is correct`)
        }

        if (!savedProperties[compName]) {
            savedProperties[compName] = [];
        }

        const createdOptions = new SavedPropertyOptions();
        Object.assign(createdOptions,options);
        savedProperties[compName].push({
            name: propertyKey,
            type: propertyType,
            options:createdOptions
        });

        if(propertyType === undefined) {
            console.error(`Property type: ${propertyKey} in comp ${compName} is undefined. Please use Saved(TYPEOFARRAYITEM) to specify type.`);
        } else if(propertyType === Object) {
            console.error(`Property: ${propertyKey} in comp ${compName} has bad type. Please use Saved(TYPEOFITEM) to manually specify.`)
        }

        if(environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light) {
            //Set to protected and get other descriptors
            let originalDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            const originalKey = GetDescriptorHideVarName(propertyKey);
            target[originalKey] = target[propertyKey];

            // Print errors if wrong type
            Object.defineProperty(target, propertyKey, {
                get: function() {
                    return this[originalKey];
                },
                set: function(value) {
                    if(originalDescriptor && originalDescriptor.set) {
                        originalDescriptor.set(value);
                    }
                    CheckTypingForProperty(value, propertyKey, compName);
                    this[originalKey] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }
}

/** Debug Check to see if property typing is correct (not in production due to overhead) */
export function CheckTypingForProperty(newVal: any, propertyKey: string, compName:string) {
    if(environmentVaraibleTracker.GetDebugMode() == DebugMode.None) return;
    const desiredType = FindSavedProperty(compName,propertyKey);
    if (desiredType) {
        if (typeof newVal === 'object' && Array.isArray(newVal)) {
            //Check typing of each element
            newVal.forEach(e => {
                checkTyping(desiredType.type, e, propertyKey);
            });
        } else {
            checkTyping(desiredType.type, newVal, propertyKey);
        }
    }
}

function checkTyping(type:Function,value:any,keyname:string) {
    //Allow setting of anything to undefined
    if(value === undefined) {
        return;
    }

    // Handle primitive types
    if ((type === Number && typeof value !== 'number') ||
        (type === String && typeof value !== 'string') ||
        (type === Boolean && typeof value !== 'boolean')) {
        console.error(`Invalid type set for ${keyname}. Expected ${type.name}, but received ${typeof value}.`);
        return;
    }
    
    if(IsEnumType(type)) {
        const vals = Object.values(type);
        if(vals.includes(value)) {
            return;
        }
        const keys = Object.keys(type);
        if(keys.includes(value)) {
            return;
        }
        console.error(`Invalid type set for ${keyname}. Expected enum, but received ${typeof value}.`);
        return;
    }

    // Handle non-primitive types
    if (!(value instanceof type) && 
        type !== Number && type !== String && type !== Boolean) {
        console.error(`Invalid type set for ${keyname}. Expected instance of ${type.name}, but received ${typeof value}.`);
        return;
    }
}

export class RegisteredTypeOptions {
    bEditorAddable = true;
    bEditorRemovable = true;
    /** Required to be added for this component */
    RequiredComponents: (typeof Component)[] = [];
    comment = "";
}

export type storedRegisteredType =  {
    type:Function;
    options:RegisteredTypeOptions;
    bitId:number;
}

export const registeredTypes:{[compName:string]:storedRegisteredType} = {};
export function RegisteredType(target:Function,options:Partial<RegisteredTypeOptions> = {}) {
    return function(something:Function) {
        if(target === undefined) {
            console.error("Target was not set for registered type!");
            return;
        }
        const className = target.name;
        if(registeredTypes[className]) {
            console.error("Class name clash for registered component: " + className);
            return;
        }
        const createdOptions = new RegisteredTypeOptions();
        Object.assign(createdOptions,options);
        registeredTypes[className] = {type:target,options:createdOptions,bitId:Object.keys(registeredTypes).length};
        if(!savedProperties[className]) {
            savedProperties[className] = [];
        }
    }
}

export function DeepComponentSavedPropsEquals(obj1, obj2) {

    //TODO: Something about the prop keys not working
    return false;

    // If both are the same instance, return true
    if (obj1 === obj2) return true;

    // If one of them is null or undefined but not the other, return false
    if (!obj1 || !obj2) return false;

    // If objects are not of type "object", compare them directly
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    // Get the keys of both objects
    var keys1 = Object.keys(obj1);
    var keys2 = Object.keys(obj2);

    var compType = registeredTypes[obj1.constructor.name];
    if(compType === undefined) {
        compType = registeredTypes[obj2.constructor.name];
    }

    if(compType !== undefined) {
        //Filter keys by only those with saved property
        var newKeys1 = [];
        for(var i = 0; i < keys1.length;i++) {
            const trimmedKey = keys1[i].replace("___CUSTOMTYPECHECKED___","");
            if(savedProperties[compType.type.name][trimmedKey] !== undefined) {
                newKeys1.push(trimmedKey);
            }
        }
        var newKeys2 = [];
        for(var i = 0; i < keys2.length;i++) {
            const trimmedKey = keys2[i].replace("___CUSTOMTYPECHECKED___","");
            if(savedProperties[compType.type.name][trimmedKey] !== undefined) {
                newKeys2.push(trimmedKey);
            }
        }
        keys1=newKeys1;
        keys2=newKeys2;
    }

    // If they don't have the same number of keys, they are not equal
    if (keys1.length !== keys2.length) return false;

    // If any key is missing in the second object or its value is different from the first, return false
    for (let key of keys1) {
        if (!keys2.includes(key) || !DeepComponentSavedPropsEquals(obj1[key], obj2[key])) return false;
    }

    return true;
}