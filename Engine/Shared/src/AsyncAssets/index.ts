import { AsyncAssetManager } from "./Framework/AsyncAssetManager.js";
import { AsyncInMemoryFrontend } from "./Framework/AsyncInMemoryFrontend.js";
import { AsyncIndexDBFrontend } from "./Framework/AsyncIndexDBFrontend.js";
import { AsyncAWSBackend } from "./Framework/AsyncAWSBackend.js";
import { InstancedMeshTransform, SetTransformArray } from "./Utils/InstanceMeshUtils.js";
import { StaticMeshCloneDetails, StaticMeshInstanceDetails } from "./AsyncStaticMesh.js";
import { AsyncSkeletalMeshDefinition, SkeletalMeshCloneDetails } from "./AsyncSkeletalMesh.js";
import { AsyncGUIDescription } from "./AsyncGUI.js";
import { AsyncImageDescription } from "./AsyncImage.js";
import { AsyncMaterial } from "./AsyncMaterial.js";
import { AsyncStaticMeshDefinition, UpdateAllMeshDefinitions } from "./AsyncStaticMeshDefinition.js";
import { AsyncAudioClipDefinition, AudioClipInstance } from "./AsyncAudioClip.js";
import {
    AsyncAssetLoader,
    AwaitForAllAsyncAssetsToLoad,
    GetCurrentlyLoadingAsyncAssets,
} from "./Framework/AsyncAssetLoader.js";
import { SceneAsyncLoader } from "./SceneAsyncLoader.js";
import "@babylonjs/loaders/glTF";
import { UpdateBackgroundCache } from "./Framework/BackgroundCacher.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";
import { AsyncStaticMeshInstanceRunner } from "./AsyncStaticMeshInstanceRunner.js";
import { AsyncZipPuller } from "./Framework/AsyncZipPuller.js";
export type { IBackendStorageInterface, IFrontendStorageInterface } from "./Framework/StorageInterfaceTypes.js";

function UpdateAsyncSystemOnTick() {
    UpdateAllMeshDefinitions();
    UpdateBackgroundCache();
}

/** Add exports here! */
export {
    AsyncAssetManager,
    AsyncInMemoryFrontend,
    AsyncAWSBackend,
    AsyncIndexDBFrontend,
    AsyncAssetLoader,
    AsyncDataType,
    SceneAsyncLoader,
    AsyncZipPuller,
    AwaitForAllAsyncAssetsToLoad,
    GetCurrentlyLoadingAsyncAssets,
    AsyncStaticMeshDefinition,
    StaticMeshCloneDetails,
    StaticMeshInstanceDetails,
    AsyncStaticMeshInstanceRunner,
    AsyncSkeletalMeshDefinition,
    SkeletalMeshCloneDetails,
    AsyncMaterial,
    AsyncGUIDescription,
    AsyncAudioClipDefinition,
    AudioClipInstance,
    AsyncImageDescription,
    InstancedMeshTransform,
    SetTransformArray,
    UpdateAsyncSystemOnTick,
    GetAsyncSceneIdentifier,
};
