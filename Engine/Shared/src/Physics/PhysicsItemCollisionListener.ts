import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { IBasePhysicsCollisionEvent, IPhysicsCollisionEvent, Mesh, Observer } from "@babylonjs/core"
import { CustomPhysicBody, PhysicsItem } from "./PhysicsItem";
import { EntityData } from "../EntitySystem/EntityData";
import { PhysicsMeshComponent } from "./PhysicsMesh";
import { PhysicsBoxComponent } from "./PhysicsBox";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { PhysicsMasterComponent } from "./PhysicsMasterComponent";
import { GameSystem } from "../GameLoop/GameSystem";
import { GameEcosystem } from "../GameEcosystem";
import { SystemHookType } from "../GameLoop/GameSystemLoop";

export type PhysicsCollision = {
    state:IBasePhysicsCollisionEvent;
    collideAgainst:PhysicsItem;
    collider:PhysicsItem;
}

function getPhysicsItem(owner:EntityData) {
    if(owner.GetComponent(PhysicsMeshComponent)) return owner.GetComponent(PhysicsMeshComponent);
    if(owner.GetComponent(PhysicsBoxComponent)) return owner.GetComponent(PhysicsBoxComponent);
    return undefined;
}

@RegisteredType(PhysicsCollisionThisFrame,{comment:"Notifies we have had a collision this frame"})
export class PhysicsCollisionThisFrame extends Component {

}

@RegisteredType(PhysicsItemCollisionListener,{comment:"Listens for physics collisions and reports them here"})
export class PhysicsItemCollisionListener extends Component {

    @Saved(Number,{})
    framesToKeepDataFor = 2;

    bindingData:{mesh:Mesh,instance:number,overlapEvent:Observer<IPhysicsCollisionEvent>,collisionEvent:Observer<IPhysicsCollisionEvent>};

    private recentCollisions:PhysicsCollision[][] = [[]];

    onComponentAdded(): void {
        const collider = getPhysicsItem(this.entityOwner);
        if(!collider) return;
        this.bindForCollisions(collider);
        collider.onMeshRebuilt.add((m)=>{
            this.bindForCollisions(m);
        })
    }

    /** 0 is current frame */
    getCollisionData(frame:number) {
        if(frame > this.framesToKeepDataFor-1) return;
        if(this.recentCollisions.length-1 < frame) return;
        return this.recentCollisions[frame];
    }

    /** Increment frames so we are now 1 ahead of where we were */
    updatePhysicsCollisionFrame() {
        if(this.recentCollisions.length < this.framesToKeepDataFor) {
            this.recentCollisions.unshift([]);
        } else {
            this.recentCollisions.pop();
            this.recentCollisions.unshift([]);
        }
        if(this.entityOwner && this.entityOwner.owningSystem) {
            (this.entityOwner.owningSystem as EntitySystem).RemoveComponent(this.entityOwner,PhysicsCollisionThisFrame);
        }
    }

    bindForCollisions(physicsItem:PhysicsItem) {
        if(this.bindingData && this.bindingData.mesh === physicsItem.physicsMesh && this.bindingData.instance === physicsItem.physicsInstanceNumber) return;
        this.unbindForCollisions();
        if(!physicsItem.physicsMesh || !physicsItem.physicsMesh.physicsBody) return;
        
        const physicsOwner = (physicsItem.entityOwner.owningSystem as EntitySystem).GetEntitiesWithData([PhysicsMasterComponent],[]).GetEntitiesArray()[0].GetComponent(PhysicsMasterComponent);
        if(physicsItem.triggerOnly) {
            this.bindingData = {
                mesh:physicsItem.physicsMesh,
                instance:physicsItem.physicsInstanceNumber,
                overlapEvent:physicsOwner.onTriggerCollision.add(e=>{
                    this.tryExtractPhysicsDetails(e,physicsItem)
                }),
                collisionEvent:undefined
            }
        } else {
            this.bindingData = {
                mesh:physicsItem.physicsMesh,
                instance:physicsItem.physicsInstanceNumber,
                collisionEvent:physicsOwner.onTriggerCollision.add(e=>{
                    this.tryExtractPhysicsDetails(e,physicsItem)
                }),
                overlapEvent:undefined
            }
        }
    }
    
    unbindForCollisions() {
        if(!this.bindingData) return;
        if(!this.bindingData.mesh) return;
        if(!this.entityOwner) return;
        if(!this.entityOwner.owningSystem) return;

        const physicsOwner = (this.entityOwner.owningSystem as EntitySystem).GetEntitiesWithData([PhysicsMasterComponent],[]).GetEntitiesArray()[0].GetComponent(PhysicsMasterComponent);
        if(this.bindingData.overlapEvent) {
            physicsOwner.onTriggerCollision.remove(this.bindingData.overlapEvent)
        }
        if(this.bindingData.collisionEvent) {
            physicsOwner.onCollisionCollision.remove(this.bindingData.collisionEvent)
        }
    }

    private tryExtractPhysicsDetails(e:IBasePhysicsCollisionEvent,physicsItem:PhysicsItem) {
        var ourItem:PhysicsItem;
        var otherItem:PhysicsItem;

        if(e.collider === physicsItem.physicsMesh.physicsBody) {
            ourItem = (e.collider as CustomPhysicBody).owningPhysicsItems[e.colliderIndex];
            // Try to get other
            if((e.collidedAgainst as CustomPhysicBody).owningPhysicsItems) {
                ourItem = (e.collidedAgainst as CustomPhysicBody).owningPhysicsItems[e.collidedAgainstIndex];
            }

        } else if(e.collidedAgainst === physicsItem.physicsMesh.physicsBody) {
            otherItem = (e.collidedAgainst as CustomPhysicBody).owningPhysicsItems[e.collidedAgainstIndex];
            // Try to get other
            if((e.collider as CustomPhysicBody).owningPhysicsItems) {
                ourItem = (e.collider as CustomPhysicBody).owningPhysicsItems[e.colliderIndex];
            }
        }

        if(!ourItem && !otherItem) return;
        this.recentCollisions[0].push({collideAgainst:otherItem,collider:ourItem,state:e})
        if(this.entityOwner && this.entityOwner.owningSystem) {
            (this.entityOwner.owningSystem as EntitySystem).AddSetComponentToEntity(this.entityOwner,new PhysicsCollisionThisFrame());
        }
    }
}


export class PhysicsCollisonListenerSystem extends GameSystem {
    SystemOrdering = 10000;
    systemHookType = SystemHookType.Physics;

    SetupGameSystem(ecosystem: GameEcosystem) {

    }
    RunSystem(ecosystem: GameEcosystem, deltaTime: number) {
        ecosystem.entitySystem.GetEntitiesWithData([PhysicsItemCollisionListener],[]).iterateEntities(e=>{
            e.GetComponent(PhysicsItemCollisionListener).updatePhysicsCollisionFrame();
        })
    }

}