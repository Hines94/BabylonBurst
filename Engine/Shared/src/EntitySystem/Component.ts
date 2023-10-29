import 'reflect-metadata';
import { EntityData } from './EntityData';

export class Component {
    static GetComponentName(comp:any) : string{
        return comp.constructor.name;
    }
    /** Warning - Care chaining events on this as we can have the situation where prefabs/data is Partially loaded */
    onComponentAdded(entData:EntityData) {}
    /** Called just before component removed */
    onComponentRemoved(entData:EntityData) {}
    /** Called at the end of the frame (not instantly on var change) */
    onComponentChanged(entData:EntityData) {}
}