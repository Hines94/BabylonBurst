import { InstancedMeshRenderSystem } from "./Rendering/InstancedMeshRenderSystem";
import { debugBoxVis } from "./Admin/DebugBoxVisualiser";
import { UpdateAdminInterface } from "./Admin/AdminDebugInterface";
import { DebugMode, environmentVaraibleTracker } from "../../Shared/src/Utils/EnvironmentVariableTracker";
import { ServerConnectionProcesserSystem, serverConnection } from "./Networking/ServerConnection";
import { UpdateAllTickables } from "./Utils/BaseTickableObject";
import { UpdateTickClient } from "@userCode/ClientMain";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { LightingGameSystem } from "./Rendering/LightsSystem";
import { UpdateAsyncSystemOnTick } from "@BabylonBurstCore/AsyncAssets";
import { NavigationAgent } from "@BabylonBurstCore/Navigation/NavigationAgent";
import { NavAgentVisualisationSystem } from "@BabylonBurstCore/Navigation/NavAgentVisualistaionSystem";
import { GetSystemOfType, preRenderLooper, renderLooper } from "@BabylonBurstCore/GameLoop/GameSystemLoop";
import { AnimationInterpSystem } from "@BabylonBurstClient/Rendering/AnimationInterpSystem";
import { RegisterDefaultCoreSystems } from "@BabylonBurstCore/GameLoop/GameSystemPriorities";
import { InstancedSkeletalMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedSkeletalMeshRenderSystem";

function RegisterDefaultClientSystems(ecosystem: GameEcosystem) {
    if (GetSystemOfType(InstancedMeshRenderSystem)) {
        return;
    }

    new InstancedSkeletalMeshRenderSystem();
    new InstancedMeshRenderSystem();
    new AnimationInterpSystem();
    new LightingGameSystem();
    new ServerConnectionProcesserSystem();

    const navAgentViz = new NavAgentVisualisationSystem();

    if (ecosystem.isEditor === false) {
        navAgentViz.bSystemEnabled = false;
    }

    RegisterDefaultCoreSystems();

    //Setup alternative loops
    ecosystem.scene.onBeforeRenderObservable.add(() => {
        preRenderLooper.RunGameSystems(ecosystem);
    });
}

/** Our tick system that contains general functions like rendering that we will want on a range of windows */
export function UpdateSystemsLoop(ecosystem: GameEcosystem, specificSystems: (ecosystem: GameEcosystem) => void) {
    if (ecosystem.sceneSettings.sceneFullySetup() === false) {
        return;
    }
    RegisterDefaultClientSystems(ecosystem);

    //Our main systems updater (For render)
    renderLooper.RunGameSystems(ecosystem);

    if (serverConnection) {
        serverConnection.ProcessQueuedServerMessages(ecosystem);
    }

    //Our client tick
    UpdateTickClient(ecosystem);

    //Update each of our core systems
    specificSystems(ecosystem);

    //Debug
    debugBoxVis.UpdateDebugItems(ecosystem.deltaTime);

    if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.None) {
        UpdateAdminInterface(ecosystem);
    }

    //Generic tickables (eg html GUI etc)
    UpdateAllTickables(ecosystem);

    //Update our visual models on tick (instances and downloading etc)
    UpdateAsyncSystemOnTick();

    ecosystem.entitySystem.ResetChangedComponents();
}
