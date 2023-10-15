import 'reflect-metadata';
import { EntityData } from './EntityData';

export class Component {
    static GetComponentName(comp:any) : string{
        return comp.constructor.name;
    }
    onComponentAdded(entData:EntityData) {}
    onComponentRemoved(entData:EntityData) {}
    onComponentChanged(entData:EntityData) {}
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