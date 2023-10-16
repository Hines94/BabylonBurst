import 'reflect-metadata';

export type savedProperty = {
    name:string;
    type:any;
    isArray:boolean;
}

export const FindSavedProperty = (compName: string, propName: string) => 
    savedProperties[compName]?.find(prop => prop.name === propName);

export const savedProperties:{[compName:string]:savedProperty[]} = {};
export const networkedProperties:{[compName:string]:savedProperty[]} = {};

// Networked decorator
export function Networked(target: any, propertyKey: string) {
    const compName = target.constructor.name;
    
    // Get the type of the property using reflect-metadata
    const propertyType = Reflect.getMetadata('design:type', target, propertyKey);
    
    if(!networkedProperties[compName]) {
        networkedProperties[compName] = [];
    }

    // Save both the property name and its type
    networkedProperties[compName].push({
        name: propertyKey,
        type: propertyType.name,
        isArray: false
    });
}

// Saved decorator
export function Saved(type?: Function) {
    return function (target: any, propertyKey: string) {
        const compName = target.constructor.name;
        const reflectType = Reflect.getMetadata('design:type', target, propertyKey);
        const propertyType = type || reflectType;
        console.log(reflectType)

        if (!savedProperties[compName]) {
            savedProperties[compName] = [];
        }

        const isarr = reflectType === Array;
        savedProperties[compName].push({
            name: propertyKey,
            type: propertyType,
            isArray: isarr
        });

        if(isarr && type === undefined) {
            console.error(`Property: ${propertyKey} in comp ${compName} is an array but no type. Please use Saved(TYPEOFARRAYITEM) for arrays.`);
        } else if(propertyType === undefined) {
            console.error(`Property type: ${propertyKey} in comp ${compName} is undefined. Please use Saved(TYPEOFARRAYITEM) to specify type.`);
        } else if(propertyType === Object) {
            console.error(`Property: ${propertyKey} in comp ${compName} has bad type. Please use Saved(TYPEOFITEM) to manually specify.`)
        }
    }
}

export const registeredTypes:{[compName:string]:Function} = {};
export function RegisteredType(target:Function) {
    const className = target.name;
    if(registeredTypes[className]) {
        console.error("Class name clash for registered component: " + className);
    }
    registeredTypes[className] = target;
    if(!savedProperties[className]) {
        savedProperties[className] = [];
    }
}
