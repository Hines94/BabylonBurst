import 'reflect-metadata';
import { EntityData } from './EntityData';

type savedProperty = {
    name:string;
    type:any;
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
        type: propertyType.name  // Getting the name of the type, assuming it's a class or basic type
    });
}

// Saved decorator
export function Saved(target: any, propertyKey: string) {
    const compName = target.constructor.name;
    
    // Get the type of the property using reflect-metadata
    const propertyType = Reflect.getMetadata('design:type', target, propertyKey);
    
    if(!savedProperties[compName]) {
        savedProperties[compName] = [];
    }

    // Save both the property name and its type
    savedProperties[compName].push({
        name: propertyKey,
        type: propertyType  // Getting the name of the type, assuming it's a class or basic type
    });
}

export const registeredComponents:{[compName:string]:Function} = {};
export function RegisteredComponent(target:Function) {
    const className = target.name;
    if(registeredComponents[className]) {
        console.error("Class name clash for registered component: " + className);
    }
    registeredComponents[className] = target;
}

export class Component {
    static GetComponentName(comp:any) : string{
        return comp.constructor.name;
    }
}



//--- PROXY FOR CHANGE NOTIFICAITON ---

const proxyCallbackSymbol ='___proxyCallbackSymbol___';

/** Setup all items inside to be able to recieve proxy calls */
export function DeepSetupCallback(comp: any,callback:()=>void) {
    // If the component is not an object, is null, or already proxied, return it as-is
    if (typeof comp === 'object' && comp instanceof EntityData === false) {
        comp[proxyCallbackSymbol] = callback;

        for (const key in comp) {
            DeepSetupCallback(comp[key],callback);
        }
    }
}

const values = new WeakMap();
export function TrackedVariable(): PropertyDecorator {
    return function(target: any, propertyName: string) {
        Object.defineProperty(target, propertyName, {
            get: function() {
                return values.get(this);
            },
            set: function(value) {
                values.set(this, value);
                if (this[proxyCallbackSymbol] !== undefined) {
                    // Assuming DeepSetupCallback is defined somewhere in your code
                    DeepSetupCallback(value, this[proxyCallbackSymbol]);
                    this[proxyCallbackSymbol]();
                }
            },
            enumerable: true,
            configurable: true
        });
    };
}