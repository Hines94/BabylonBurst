import { Component } from "../EntitySystem/Component";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { EntVector3 } from "../EntitySystem/CoreComponents";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { HavokPlugin } from "@babylonjs/core";

@RegisteredType(PhysicsMasterComponent,{RequiredComponents:[],comment:`Controls physics meta for this world`})
export class PhysicsMasterComponent extends Component {

    @TrackedVariable()
    @Saved(Boolean,{comment:"Is physics enabled?"})
    physicsEnabled = true;


    @TrackedVariable()
    @Saved(EntVector3,{comment:"Constant gravity force if applicable"})
    gravity = new EntVector3(0,-9.81,0);

    priorParameters:PhysicsMasterComponent;

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
        } else {
            ecosystem.scene.enablePhysics(EntVector3.GetVector3(this.gravity),new HavokPlugin());
        }
    }
}