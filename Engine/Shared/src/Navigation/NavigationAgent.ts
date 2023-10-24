import { IAgentParameters } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntTransform, EntVector3 } from "../EntitySystem/CoreComponents";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";


@RegisteredType(NavigationAgent,{RequiredComponents:[EntTransform],comment:`An agent that will be able to move around a navmesh`})
export class NavigationAgent extends Component {
    @TrackedVariable()
    @Saved(EntVector3,{comment:"TODO: Look at agents using multiple layers etc"})
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
    agentIndex:number;
    priorBuildParams:IAgentParameters;
    priorMoveTarget:EntVector3;

    getAgentParams():IAgentParameters {

    }
}