import { RunInstancedMeshRenderSystem } from "./Rendering/InstancedMeshRenderSystem";
import { debugBoxVis } from "./Admin/DebugBoxVisualiser";
import { UpdateAdminInterface } from "./Admin/AdminDebugInterface";
import { DebugMode, environmentVaraibleTracker } from "./Utils/EnvironmentVariableTracker";
import { serverConnection } from "./Networking/ServerConnection";
import { UpdateAllTickables } from "./Utils/BaseTickableObject";
import { GameEcosystem } from "../../Shared/src/GameEcosystem";
import { RunColliderVisualSystem } from "./Rendering/ColliderVisualRenderSystem";
import { UpdateAsyncSystemOnTick } from "../../Shared/src/AsyncAssets";
import { UpdateTick } from "@userCode/Main";

/** Game specific systems like building only for main game */
export function UpdateGameSpecificSystems(gameClient: GameEcosystem) {
    if (serverConnection) {
        serverConnection.ProcessQueuedServerMessages(gameClient);
    }
}

/** Our tick system that contains general functions like rendering that we will want on a range of windows */
export function UpdateSystemsLoop(gameClient: GameEcosystem, specificSystems: (ecosystem: GameEcosystem) => void) {
    if (gameClient.sceneSettings.sceneFullySetup() === false) {
        return;
    }

    //Anim interp is needed if we are running higher framerates to smooth movement
    evaluateAnimInterp(gameClient);

    //Generic tickables (eg html GUI etc)
    UpdateAllTickables(gameClient);

    UpdateTick(gameClient);

    //Update each of our core systems
    specificSystems(gameClient);
    runSystem(gameClient, RunInstancedMeshRenderSystem);
    runSystem(gameClient, RunColliderVisualSystem);

    //Debug
    debugBoxVis.UpdateDebugItems(gameClient.deltaTime);

    if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.None) {
        UpdateAdminInterface(gameClient);
    }

    //Update our visual models on tick (instances and downloading etc)
    UpdateAsyncSystemOnTick();

    //gameClient.entitySystem.ResetChangedComponents(); TODO: Reset changed in WASM!
}

function runSystem(ecosystem: GameEcosystem, system: (ecosystem: GameEcosystem) => void) {
    system(ecosystem);
}

//Anim interp is needed if we are running higher framerates to smooth movement
var timeSinceAnimEval = 10;
function evaluateAnimInterp(gameClient: GameEcosystem) {
    timeSinceAnimEval += gameClient.deltaTime;
    if (timeSinceAnimEval < 3) {
        return;
    }
    timeSinceAnimEval = 0;
    gameClient.sceneSettings.SetAnimationInterp(1 / gameClient.deltaTime > 50);
}
