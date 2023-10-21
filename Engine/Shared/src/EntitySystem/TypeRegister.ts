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

