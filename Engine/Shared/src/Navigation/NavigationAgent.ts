import { IAgentParameters, TransformNode } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntTransform, EntVector3 } from "../EntitySystem/CoreComponents";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { GameEcosystem } from "../GameEcosystem";
import { EntityData } from "../EntitySystem/EntityData";
import { NavigationLayer } from "./NavigationLayer";
import { GameSystem } from "../GameLoop/GameSystem";
import { NavAgentTransformUpdatePriority } from "../GameLoop/GameSystemPriorities";


@RegisteredType(NavigationAgent,{RequiredComponents:[EntTransform],comment:`An agent that will be able to move around a navmesh`})
export class NavigationAgent extends Component {
    @TrackedVariable()
    @Saved(String,{comment:"TODO: Look at agents using multiple layers etc"})
    targetNavigationLayer = "default";

    @TrackedVariable()
    @Saved(EntVector3,{comment:"Location we are trying to move to. If 0,0,0 (or nearly) then counts as no target set."})
    TargetLocation = new EntVector3();

    @TrackedVariable()
    @Saved(Number,{comment:"Radius of this agent on the navmesh"})
    radius = 0.6;

    @TrackedVariable()
    @Saved(Number,{comment:"Height of this agent on the navmesh"})
    height = 2;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum accelelration of this agent (m/s)"})
    maxAcceleration = 4.0;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum speed of the agent (m/s)"})
    maxSpeed = 1.0;

    @TrackedVariable()
    @Saved(Number,{comment:"How far ahead the agent looks to detect potential collisions"})
    collisionQueryRange = 0.5;

    @TrackedVariable()
    @Saved(Number,{comment:"How far ahead to optimize. A longer range may result in more direct routes but may also increase the computational cost."})
    pathOptimizationRange = 0.0;

    @TrackedVariable()
    @Saved(Number,{comment:"Higher weight means the agent will prioritize keeping distance from others but might interfere with aligntment/cohesion etc."})
    separationWeight = 1.0;

    //This will be set when our agent has been added to their intended layers
    IsStopped = true;
    agentIndex:number;
    priorBuildParams:IAgentParameters;
    priorMoveTarget:EntVector3;
    transformNode:TransformNode;
    static onAgentRebuild

    getAgentParams():IAgentParameters {
        return {
            radius:this.radius,
            height:this.height,
            maxAcceleration:this.maxAcceleration,
            maxSpeed:this.maxSpeed,
            collisionQueryRange:this.collisionQueryRange,
            pathOptimizationRange:this.pathOptimizationRange,
            separationWeight:this.separationWeight
        }
    }

    IsSetup() : boolean {
        return this.agentIndex !== undefined && this.transformNode !== undefined && this.priorBuildParams !== undefined;
    }

    /** For instant travel. For regular use the desiredLocation vector instead. */
    TeleportToLocation(desiredLoc:EntVector3,owningEnt:EntityData, bStopCurrentTarget = true) : boolean {
        if(owningEnt === undefined) {
            return false;
        }
        if(!this.IsSetup()) {
            return false;
        }
        const navLayer = NavigationLayer.GetNavigationLayer(this.targetNavigationLayer,owningEnt.owningSystem);
        if(navLayer === undefined) {
            return false;
        }
        navLayer.navLayerCrowd.agentTeleport(this.agentIndex,EntVector3.GetVector3(desiredLoc));
        EntVector3.Copy(owningEnt.GetComponent(EntTransform).Position,desiredLoc);
        if(bStopCurrentTarget) {
            this.IsStopped = true;
            this.priorMoveTarget = desiredLoc;
            this.TargetLocation = desiredLoc;
        }
    }
}

export class NavAgentTransformSystem extends GameSystem {
    SystemOrdering = NavAgentTransformUpdatePriority;

    RunSystem(ecosystem: GameEcosystem) {
        const allAgents = ecosystem.entitySystem.GetEntitiesWithData([EntTransform,NavigationAgent],[]);
        allAgents.iterateEntities(e=>{
            const navAgent = e.GetComponent(NavigationAgent);
            if(navAgent.transformNode === undefined || navAgent.agentIndex === undefined) {
                return;
            }

            const entTransform = e.GetComponent(EntTransform);
            entTransform.copyFromMesh(navAgent.transformNode);
        })
    }

}