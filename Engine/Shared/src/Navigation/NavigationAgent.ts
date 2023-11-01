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
import { DeepEquals } from "../Utils/HTMLUtils";


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

    @Saved(Number,{comment:"Distance to the target that we can terminate our movement attempt. If too small then can cause jiggling issues"})
    acceptableMovementDistance = 2;

    IsStopped = true;
    /** This can be set to false if we want our agent to use some other custom behaviour */
    AutoMoveToTarget = true;
    
    //This will be set when our agent has been added to their intended layers
    agentIndex:number;
    priorBuildParams:IAgentParameters;
    priorMoveTarget:EntVector3;
    transformNode:TransformNode;
    navLayer:NavigationLayer;

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

    RebuildAgent(navLayer:NavigationLayer,agentEnt:EntityData, ecosystem:GameEcosystem) {
        if(navLayer === undefined) {
            return;
        }
        const newParams = this.getAgentParams();
        if(DeepEquals(newParams,this.priorBuildParams)) {
            return;
        }
        if(navLayer.navLayerCrowd === undefined) {
            return;
        }
        const transform = agentEnt.GetComponent(EntTransform);
        if(transform === undefined) {
            return;
        }
        if(this.transformNode === undefined) {
            this.transformNode = new TransformNode(`NavAgentTransform_${agentEnt.EntityId}`,ecosystem.scene);
            this.agentIndex = navLayer.navLayerCrowd.addAgent(EntVector3.GetVector3(transform.Position),newParams,this.transformNode);
            this.priorBuildParams = newParams;
            this.navLayer = navLayer;
            EntVector3.Copy(transform.Position,EntVector3.VectorToEnt(this.transformNode.position));
        } else {
            navLayer.navLayerCrowd.updateAgentParameters(this.agentIndex,newParams);
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

    /** Called from Nav build system when detected that agent movement changed */
    AgentAutoMove(navLayer:NavigationLayer) {
        if(this.AutoMoveToTarget === false) {
            return;
        }
        this.MoveToCurrentTarget(navLayer);
    }

    RequiresMoveTowardsTarget(navLayer:NavigationLayer) {
        if(this.navLayer === undefined) {
            return false;
        }
        if(this.agentIndex === undefined) {
            return false;
        }   
        if(this.TargetLocation === undefined) {
            return false;
        }
        if(this.navLayer.NavigationLayerName !== this.targetNavigationLayer) {
            console.error("Agent has incorrect layer!");
            return false;
        }
        if(EntVector3.Equals(this.TargetLocation, this.priorMoveTarget)) {
            return false;
        }
        return true;
    }

    /** Call this to directly move to next target */
    MoveToCurrentTarget(navLayer:NavigationLayer) {
        if(!this.RequiresMoveTowardsTarget(navLayer)) {
            return;
        }
    
        if(EntVector3.Zero(this.TargetLocation)) {
            this.IsStopped = true;
        } else {
            const closestPos = navLayer.navLayerPlugin.getClosestPoint(EntVector3.GetVector3(this.TargetLocation));
            navLayer.navLayerCrowd.agentGoto(this.agentIndex,closestPos);
            this.IsStopped = false;
        }
        this.priorMoveTarget = EntVector3.clone(this.TargetLocation);
    }
}

/** Updates the transform position to the nav agent */
export class NavAgentTransformSystem extends GameSystem {
    SystemOrdering = NavAgentTransformUpdatePriority;

    SetupGameSystem(ecosystem: GameEcosystem) {

    }

    RunSystem(ecosystem: GameEcosystem) {
        const allAgents = ecosystem.entitySystem.GetEntitiesWithData([EntTransform,NavigationAgent],[]);
        allAgents.iterateEntities(e=>{
            const navAgent = e.GetComponent(NavigationAgent);
            if(navAgent.transformNode === undefined || navAgent.agentIndex === undefined) {
                return;
            }

            const entTransform = e.GetComponent(EntTransform);
            entTransform.copyFromMesh(navAgent.transformNode);

            const distToTarget = EntVector3.Length(EntVector3.Subtract(entTransform.Position,navAgent.TargetLocation));
            if(distToTarget < navAgent.acceptableMovementDistance) {
                navAgent.IsStopped = true;
                navAgent.TargetLocation = undefined;
                navAgent.navLayer.navLayerCrowd.agentGoto(navAgent.agentIndex, navAgent.transformNode.position);
                navAgent.navLayer.navLayerCrowd.agentTeleport(navAgent.agentIndex, navAgent.transformNode.position);
            }
        })
    }

}