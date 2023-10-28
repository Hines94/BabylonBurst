import { InstancedMeshRenderSystem, RunInstancedMeshRenderSystem } from "./Rendering/InstancedMeshRenderSystem";
import { debugBoxVis } from "./Admin/DebugBoxVisualiser";
import { UpdateAdminInterface } from "./Admin/AdminDebugInterface";
import { DebugMode, environmentVaraibleTracker } from "../../Shared/src/Utils/EnvironmentVariableTracker";
import { serverConnection } from "./Networking/ServerConnection";
import { UpdateAllTickables } from "./Utils/BaseTickableObject";
import { ColliderVisualSystem } from "./Rendering/ColliderVisualRenderSystem";
import { UpdateTickClient } from "@userCode/ClientMain";
import { GameEcosystem } from "@engine/GameEcosystem";
import { LightingGameSystem } from "./Rendering/LightsSystem";
import { UpdateAsyncSystemOnTick } from "@engine/AsyncAssets";
import { NavigationAgent } from "@engine/Navigation/NavigationAgent";
import { NavAgentVisualisationSystem } from "@engine/Navigation/NavAgentVisualistaionSystem";
import { GetSystemOfType } from "@engine/GameLoop/GameSystemLoop";
import { AnimationInterpSystem } from "@BabylonBurstClient/Rendering/AnimationInterpSystem";
import { RegisterDefaultCoreSystems } from "@engine/GameLoop/GameSystemPriorities";

/** Game specific systems like building only for main game */
export function UpdateGameSpecificSystems(gameClient: GameEcosystem) {
    if (serverConnection) {
        serverConnection.ProcessQueuedServerMessages(gameClient);
    }
    //Update game specific code
    UpdateTickClient(gameClient);
}

function RegisterDefaultClientSystems(ecosystem: GameEcosystem) {
    if (GetSystemOfType(InstancedMeshRenderSystem)) {
        return;
    }

    new InstancedMeshRenderSystem();
    new AnimationInterpSystem();
    new LightingGameSystem();

    const colSystem = new ColliderVisualSystem();
    const navAgentViz = new NavAgentVisualisationSystem();

    if (ecosystem.isEditor === false) {
        colSystem.bSystemEnabled = false;
        navAgentViz.bSystemEnabled = false;
    }

    RegisterDefaultCoreSystems();
}

/** Our tick system that contains general functions like rendering that we will want on a range of windows */
export function UpdateSystemsLoop(ecosystem: GameEcosystem, specificSystems: (ecosystem: GameEcosystem) => void) {
    if (ecosystem.sceneSettings.sceneFullySetup() === false) {
        return;
    }
    RegisterDefaultClientSystems(ecosystem);

    //Generic tickables (eg html GUI etc)
    UpdateAllTickables(ecosystem);

    //Update each of our core systems
    specificSystems(ecosystem);

    //Debug
    debugBoxVis.UpdateDebugItems(ecosystem.deltaTime);

    if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.None) {
        UpdateAdminInterface(ecosystem);
    }

    //Update our visual models on tick (instances and downloading etc)
    UpdateAsyncSystemOnTick();

    ecosystem.entitySystem.ResetChangedComponents();
}
