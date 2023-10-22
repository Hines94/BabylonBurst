import 'reflect-metadata';
import { Component } from './Component';
import { DebugMode, environmentVaraibleTracker } from '../Utils/EnvironmentVariableTracker';

export type savedProperty = {
    name:string;
    type:any;
    options:SavedPropertyOptions;
}

export const FindSavedProperty = (compName: string, propName: string) => 
    savedProperties[compName]?.find(prop => prop.name === propName);

export const savedProperties:{[compName:string]:savedProperty[]} = {};

export class SavedPropertyOptions {
    isNetworked = true;
    editorViewOnly = false;
}
// Saved decorator
export function Saved(type?: Function,options:Partial<SavedPropertyOptions> = {}) {
    return function (target: any, propertyKey: string) {
        const compName = target.constructor.name;
        const propertyType = type;


        if(type === undefined) {
            console.error(`Type not set for  ${propertyKey} in comp ${compName} in  @Saved(TYPE). Please ensure that the typing is correct`);
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
            const originalKey = `___CUSTOMTYPECHECKED___${propertyKey}`;
            target[originalKey] = target[propertyKey];
            // Define a getter and setter to ensure type
            Object.defineProperty(target, propertyKey, {
                get: function() {
                    return this[originalKey];
                },
                set: function(value) {
                    if (type) {
                        if(typeof value === 'object' && Array.isArray(value)) {
                            //Check typing of each element
                            value.forEach(e=>{
                                checkTyping(type,e,propertyKey);
                            })
                        } else {
                            checkTyping(type,value,propertyKey);
                        }
                    }
                    //TODO: Make debug option to log changes to data
                    // if(target['___proxyCallbackSymbol___']) {
                    //     console.warn(`changed: ${originalKey} - ${value}`)
                    // }
                    this[originalKey] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }
}

function checkTyping(type:Function,value:any,keyname:string) {
    // Handle primitive types
    if ((type === Number && typeof value !== 'number') ||
        (type === String && typeof value !== 'string') ||
        (type === Boolean && typeof value !== 'boolean')) {
        console.error(`Invalid type set for ${keyname}. Expected ${type.name}, but received ${typeof value}.`);
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
}

export type storedRegisteredType =  {
    type:Function;
    options:RegisteredTypeOptions;
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
        registeredTypes[className] = {type:target,options:createdOptions};
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