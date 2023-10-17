import 'reflect-metadata';
import { Component } from './Component';

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
        const reflectType = Reflect.getMetadata('design:type', target, propertyKey);
        const propertyType = type || reflectType;

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

        // if(isarr && type === undefined) {
        //     console.error(`Property: ${propertyKey} in comp ${compName} is an array but no type. Please use Saved(TYPEOFARRAYITEM) for arrays.`);
        // } else TODO: Figure out arrays?

        if(propertyType === undefined) {
            console.error(`Property type: ${propertyKey} in comp ${compName} is undefined. Please use Saved(TYPEOFARRAYITEM) to specify type.`);
        } else if(propertyType === Object) {
            console.error(`Property: ${propertyKey} in comp ${compName} has bad type. Please use Saved(TYPEOFITEM) to manually specify.`)
        }
    }
}

export class RegisteredTypeOptions {
    bEditorRemovable = true;
}

export type storedRegisteredType =  {
    type:Function;
    options:RegisteredTypeOptions;
}

export const registeredTypes:{[compName:string]:storedRegisteredType} = {};
export function RegisteredType(target:Function,options:Partial<RegisteredTypeOptions> = {}) {
    return function(target: Function) {
        if(target === undefined) {
            console.error("Target was not set for registered type!");
            return;
        }
        const className = target.name;
        if(registeredTypes[className]) {
            console.error("Class name clash for registered component: " + className);
        }
        const createdOptions = new RegisteredTypeOptions();
        Object.assign(createdOptions,options);
        registeredTypes[className] = {type:target,options:createdOptions};
        if(!savedProperties[className]) {
            savedProperties[className] = [];
        }
    }
}

