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