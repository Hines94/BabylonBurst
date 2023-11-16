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
import { EntitySystem } from "../EntitySystem/EntitySystem";


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
    @Saved(Number,{comment:"Power of braking vs accel (eg 2 and 4 max accel would be 8 max decel)"})
    stopAccelMulti = 2;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum speed of the agent (m/s)"})
    maxSpeed = 1.0;

    @TrackedVariable()
    @Saved(Number,{comment:"How far ahead the agent looks to detect potential collisions"})
    collisionQueryRange = 20;

    @TrackedVariable()
    @Saved(Number,{comment:"How far ahead to optimize. A longer range may result in more direct routes but may also increase the computational cost."})
    pathOptimizationRange = 0.0;

    @TrackedVariable()
    @Saved(Number,{comment:"Higher weight means the agent will prioritize keeping distance from others but might interfere with aligntment/cohesion etc."})
    separationWeight = 0.05;

    @Saved(Number,{comment:"Distance to the target that we can terminate our movement attempt. If too small then can cause jiggling issues"})
    acceptableMovementDistance = 5;

    /** Time this agent has had a near zero velocity whilst in a move order */
    staticTime = 0;
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
        const ret = {
            radius:this.radius,
            height:this.height,
            maxAcceleration:this.maxAcceleration,
            maxSpeed:this.maxSpeed,
            collisionQueryRange:20,
            pathOptimizationRange:this.pathOptimizationRange,
            separationWeight:0.05
        }
        //If stopped then we don't want to move anymore
        if(this.IsStopped) {
            ret.maxSpeed = 0;
            ret.maxAcceleration = this.maxAcceleration*this.stopAccelMulti;
        }
        return ret;
    }

    RebuildAgent(navLayer:NavigationLayer,agentEnt:EntityData, ecosystem:GameEcosystem) {
        const newParams = this.getAgentParams();
        if(DeepEquals(newParams,this.priorBuildParams)) {
            return;
        }

        //Requires setup?
        if(this.transformNode === undefined) {
            if(ecosystem === undefined || agentEnt === undefined || navLayer === undefined) {
                return;
            }
            if(navLayer.navLayerCrowd === undefined) {
                return;
            }
            const transform = agentEnt.GetComponent(EntTransform);
            if(transform === undefined) {
                return;
            }
            this.transformNode = new TransformNode(`NavAgentTransform_${agentEnt.EntityId}`,ecosystem.scene);
            this.agentIndex = navLayer.navLayerCrowd.addAgent(EntVector3.GetVector3(transform.Position),newParams,this.transformNode);
            this.priorBuildParams = newParams;
            this.navLayer = navLayer;
            EntVector3.Copy(transform.Position,EntVector3.VectorToEnt(this.transformNode.position));
        } else {
            if(this.navLayer === undefined || this.agentIndex === undefined) {
                return;
            }
            this.navLayer.navLayerCrowd.updateAgentParameters(this.agentIndex,newParams);
            this.priorBuildParams = newParams;
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
    AgentAutoMove() {
        if(this.AutoMoveToTarget === false) {
            return;
        }
        this.MoveToCurrentTarget();
    }

    RequiresMoveTowardsTarget() {
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
    MoveToCurrentTarget() {
        if(!this.navLayer) {
            return;
        }
        if(!this.RequiresMoveTowardsTarget()) {
            return;
        }
    
        if(EntVector3.Zero(this.TargetLocation)) {
            this.IsStopped = true;
        } else {
            const closestPos = this.navLayer.navLayerPlugin.getClosestPoint(EntVector3.GetVector3(this.TargetLocation));
            this.navLayer.navLayerCrowd.agentGoto(this.agentIndex,closestPos);
            this.IsStopped = false;
            //Can be rebuilt if previously built as store params
            this.RebuildAgent(undefined,undefined,undefined);
        }
        this.priorMoveTarget = EntVector3.clone(this.TargetLocation);
    }

    IsReadyForStop(ourEnt:EntityData) {
        if(this.staticTime > 0.5 || this.IsAtAcceptableDistance(ourEnt)) {
            return true;
        }
        return false;
    }

    IsAtAcceptableDistance(ourEnt:EntityData) {
        if(!this.IsSetup() || this.TargetLocation === undefined) {
            return false;
        }

        const entTransform = ourEnt.GetComponent(EntTransform);
        const distToTarget = EntVector3.Length2D(EntVector3.Subtract(entTransform.Position,this.TargetLocation));
        const ourVeloc = this.navLayer.navLayerCrowd.getAgentVelocity(this.agentIndex);
        const velocSq = Math.pow(ourVeloc.x + ourVeloc.z,2);
        //Stop dist = veloc^2/2a
        const decelDistance = velocSq/(this.maxAcceleration*this.stopAccelMulti*2);
        const absDistance = (this.acceptableMovementDistance + this.radius);

        if(distToTarget < (decelDistance + this.radius) || distToTarget < absDistance) {
            return true;
        } else {
            return false;
        }
    }

    static IsAgentAtLocation(loc:EntVector3,entSystem:EntitySystem, checkRadius = 0) {
        const allAgents = entSystem.GetEntitiesWithData([NavigationAgent,EntTransform],[]).GetEntitiesArray();
        for(var a = 0; a < allAgents.length;a++) {
            const e = allAgents[a];
            const transformComp = e.GetComponent(EntTransform);
            const agentComp = e.GetComponent(NavigationAgent);
            if(!agentComp.IsSetup()) {
                return;
            }
            const CheckDistance = agentComp.radius + checkRadius;
            const distanceToPoint = EntVector3.Length2D(EntVector3.Subtract(transformComp.Position,loc));
            if(CheckDistance < distanceToPoint) {
                return true;
            }
        }
        return false;
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

            if(navAgent.IsStopped || navAgent.TargetLocation === undefined) {
                return;
            }

            if(navAgent.IsReadyForStop(e)) {
                navAgent.IsStopped = true;
                navAgent.TargetLocation = undefined;
                navAgent.RebuildAgent(navAgent.navLayer,e,ecosystem);
            } else {
                if(navAgent.priorBuildParams.maxSpeed > 1 && navAgent.navLayer.navLayerCrowd.getAgentVelocity(navAgent.agentIndex).length() < 1){
                    navAgent.staticTime += ecosystem.deltaTime;
                } else {
                    navAgent.staticTime = 0;
                }
            }
        })
    }

}