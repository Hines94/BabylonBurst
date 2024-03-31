import 'reflect-metadata';
import { EntityData } from './EntityData';
import { Observable } from '@babylonjs/core';

export class Component {

    /** Entity that currently owns this component */
    entityOwner:EntityData;

    /** Called when this component triggers one of our tracked variable changes */
    componentChanged = new Observable<Component>();

    static GetComponentName(comp:any) : string{
        return comp.constructor.name;
    }

    /** Is this component attached to a valid entity? */
    IsOwnerValid() {
        return this.entityOwner && this.entityOwner.IsValid();
    }

    /** Warning - Care chaining events on this as we can have the situation where prefabs/data is Partially loaded */
    onComponentAdded() {}
    /** Called just before component removed */
    onComponentRemoved() {}
    /** Called at the end of the frame (not instantly on var change) */
    onComponentChanged() {}
}