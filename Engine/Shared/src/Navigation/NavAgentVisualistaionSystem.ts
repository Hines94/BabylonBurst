import { LinesMesh, MeshBuilder, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "../GameEcosystem";
import { NavigationAgent } from "./NavigationAgent";
import { NavigationLayer } from "./NavigationLayer";
import { GameSystem } from "../GameLoop/GameSystem";
import { NavAgentVisualisationSystemPriority } from "../GameLoop/GameSystemPriorities";

export const ShowAgentViz = "___SHOWNAVAGENTVIZ___";
var lineSystem:LinesMesh;

export class NavAgentVisualisationSystem extends GameSystem {
    SystemOrdering = NavAgentVisualisationSystemPriority;

    SetupGameSystem(ecosystem: GameEcosystem) {
        
    }

    RunSystem(ecosystem: GameEcosystem) {
        //If show agent viz is false then disable all lines
        if(!ecosystem.dynamicProperties[ShowAgentViz]) {
            if(lineSystem) {
                lineSystem.dispose();
                lineSystem = undefined;
            }
            return;
        }
        //If show agent viz is true then update lines for all agents
        const desiredLines = []
        const allAgents = ecosystem.entitySystem.GetEntitiesWithData([NavigationAgent],[]).GetEntitiesArray();
        for(var a = 0; a < allAgents.length;a++) {
            const ent = allAgents[a];
            const agentComp = ent.GetComponent(NavigationAgent);
            if(!agentComp.IsSetup() || agentComp.IsStopped) {
                continue;
            }    
            const layer = NavigationLayer.GetNavigationLayer(agentComp.targetNavigationLayer,ecosystem.entitySystem);
            if(layer === undefined) {
                continue;
            }
            const desPos = new Vector3();
            layer.navLayerCrowd.getAgentNextTargetPathToRef(agentComp.agentIndex,desPos);
            desiredLines.push([agentComp.transformNode.position,desPos]);
        }
        if(desiredLines.length === 0) {
            if(lineSystem) {
                lineSystem.dispose();
                lineSystem = undefined;
            }
            return;
        }
        lineSystem = MeshBuilder.CreateLineSystem("NavAgentLines",{lines:desiredLines,instance:lineSystem,updatable:true});
    }
}