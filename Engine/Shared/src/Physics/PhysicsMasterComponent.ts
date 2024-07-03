import { Component } from "../EntitySystem/Component";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { EntVector3 } from "../EntitySystem/CoreComponents";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { HavokPlugin, IBasePhysicsCollisionEvent, Observable } from "@babylonjs/core";
import { GetSystemOfType, prePhysicsLooper } from "../GameLoop/GameSystemLoop";
import { PhysicsCollisonListenerSystem } from "./PhysicsItemCollisionListener";

@RegisteredType(PhysicsMasterComponent,{RequiredComponents:[],comment:`Controls physics meta for this world`})
export class PhysicsMasterComponent extends Component {

    @TrackedVariable()
    @Saved(Boolean,{comment:"Is physics enabled?"})
    physicsEnabled = true;


    @TrackedVariable()
    @Saved(EntVector3,{comment:"Constant gravity force if applicable"})
    gravity = new EntVector3(0,-9.81,0);

    @TrackedVariable()
    @Saved(Number,{comment:"Number of physics steps per second"})
    physicsStepsPerS = 90;

    priorParameters:PhysicsMasterComponent;
    physicsLooperCallback:any;

    onTriggerCollision = new Observable<IBasePhysicsCollisionEvent>();
    onCollisionCollision = new Observable<IBasePhysicsCollisionEvent>();

    onComponentChanged(): void {
        this.RebuildPhysics(GetEcosystemFromEntitySystem(this.entityOwner.owningSystem));
    }

    RebuildPhysics(ecosystem:GameEcosystem) {
        if(this.priorParameters) {
            const priors = this.priorParameters;
            this.priorParameters = undefined;
            const sameBuild = priors;
            this.priorParameters = priors;
    
            if(sameBuild) {
                return;
            }
        }

        if(!this.physicsEnabled) {
            ecosystem.scene.disablePhysicsEngine();
            ecosystem.scene.onBeforePhysicsObservable.remove(this.physicsLooperCallback)
        } else {
            const hk = new HavokPlugin();
            ecosystem.scene.enablePhysics(EntVector3.GetVector3(this.gravity),hk);
            hk.onTriggerCollisionObservable.add(e=>{
                this.onTriggerCollision.notifyObservers(e);
            })
            hk.onCollisionObservable.add(e=>{
                this.onCollisionCollision.notifyObservers(e);
            })

            ecosystem.scene.getPhysicsEngine().setSubTimeStep((1/this.physicsStepsPerS)*1000);
            this.physicsLooperCallback=ecosystem.scene.onBeforePhysicsObservable.add(()=>{
                prePhysicsLooper.RunGameSystems(ecosystem)
            })
        }

        if(!GetSystemOfType(PhysicsCollisonListenerSystem)) {
            new PhysicsCollisonListenerSystem();
        }
    }
}