import 'reflect-metadata';
import { EntityData } from './EntityData';
import { GetDescriptorHideVarName } from './TypeRegister';
import { Bone, TransformNode } from '@babylonjs/core';
import { DebugMode, environmentVaraibleTracker } from '../Utils/EnvironmentVariableTracker';

export const proxyCallbackSymbol ='___proxyCallbackSymbol___';
var warned = false;

/** Setup all items inside to be able to recieve proxy calls */
export function DeepSetupCallback(comp: any,callback:()=>void) {
    if(environmentVaraibleTracker.GetBooleanVariable('DISABLE_TRACKED_VARIABLES')) {
        if(environmentVaraibleTracker.GetDebugMode() !== DebugMode.None && !warned){
            console.warn('Tracked variables are disabled');
            warned=true;
        }
        return;
    }
    if(comp instanceof Bone || comp instanceof TransformNode) return;
    // If the component is not an object, is null, or already proxied, return it as-is
    if (typeof comp === 'object' && comp instanceof EntityData === false) {
        if(Array.isArray(comp)) {
            for(var k = 0; k < comp.length;k++) {
                DeepSetupCallback(comp[k],callback);
            }
        } else {
            comp[proxyCallbackSymbol] = callback;
            for (const key in comp) {
                if(key === proxyCallbackSymbol) {
                    continue;
                }
                DeepSetupCallback(comp[key],callback);
            }
        }
    }
}

/** Track a variable so we can easily see in entity system when changed. Works with saved variable */
export function TrackedVariable(): PropertyDecorator {
    return function(target: any, propertyKey: string) {
        //Set to protected and get other descriptors
        let originalDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        const originalKey = GetDescriptorHideVarName(propertyKey);
        target[originalKey] = target[propertyKey];
        
        Object.defineProperty(target, propertyKey, {
            get: function() {
                return this[originalKey];
            },
            set: function(value) {
                if(originalDescriptor && originalDescriptor.set) {
                    originalDescriptor.set(value);
                }
                this[originalKey] = value;
                if (this[proxyCallbackSymbol] !== undefined) {
                    DeepSetupCallback(value, this[proxyCallbackSymbol]);
                    this[proxyCallbackSymbol]();
                }
            },
            enumerable: true,
            configurable: true
        });
    };
}