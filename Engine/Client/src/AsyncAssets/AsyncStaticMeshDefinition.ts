import { Mesh, MeshBuilder, Observable, Scene, StandardMaterial } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { ExtractMaterialFromAny } from "./AsyncMaterial";
import { StaticMeshCloneDetails, StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { BackgroundCacher } from "./Framework/BackgroundCacher";
import { WipePreviouslyLoadedAsyncAssets } from "./Framework/AsyncAssetLoader";
import { GetSceneLoader, SceneAsyncLoader } from "./SceneAsyncLoader";
import { InstancedMeshTransform, SetTransformArray, SetTransformAtIndex } from "./Utils/InstanceMeshUtils";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils";
import { GetAssetFullPath } from "./Utils/ZipUtils";
import { AsyncAssetManager } from ".";
import { DebugMode, environmentVaraibleTracker } from "@engine/Utils/EnvironmentVariableTracker";
import { GetBadMeshMaterial } from "@engine/Utils/MeshUtils";

/** A Dictionary of all mesh definitions with details on if they are  */
var AllMDefinitions: {
    [file: string]: { [mesh: string]: AsyncStaticMeshDefinition[] };
} = {};
var UpdateRequireSMDefinitions: AsyncStaticMeshDefinition[] = [];

var maxLocUpdatesPerFrame = 5;

export function UpdateAllMeshDefinitions() {
    if (UpdateRequireSMDefinitions.length === 0) {
        return;
    }
    for (var i = 0; i < Math.min(maxLocUpdatesPerFrame, UpdateRequireSMDefinitions.length); i++) {
        UpdateRequireSMDefinitions[i].UpdateQueuedTransformPositions();
    }
    UpdateRequireSMDefinitions = UpdateRequireSMDefinitions.slice(
        maxLocUpdatesPerFrame,
        UpdateRequireSMDefinitions.length
    );
}

var asyncMeshLoaders: {
    [sceneid: string]: { [loaderID: string]: SceneAsyncLoader };
} = {};
/**
 * Should contain information on Materials and submeshes that will be combined to one mesh from our GLTF on AWS.
 * From here we can create either an instance or clone.
 */
export class AsyncStaticMeshDefinition extends BackgroundCacher {
    desiredPath: string;
    onMeshReady = new Observable<AsyncStaticMeshDefinition>();
    startedLoadingProcess = false;
    /** Set to true if we want to accept different number of materials input vs actual mesh */
    bNoFailMaterialDiff = false;

    //Details on this definition
    meshName: string;
    materials: any[];
    fileIndex: number;
    layerMask: number;

    static GetAsyncMeshLoader(scene: Scene, desiredPath: string, fileIndex: number): SceneAsyncLoader {
        if (asyncMeshLoaders[GetAsyncSceneIdentifier(scene)] === undefined) {
            return undefined;
        }
        return asyncMeshLoaders[GetAsyncSceneIdentifier(scene)][GetAssetFullPath(desiredPath, fileIndex)];
    }

    /** Final combined meshes for each scene */
    protected finalCombinedMeshes: { [sceneid: string]: Mesh } = {};
    /** Get the final mesh after all submeshes have been combined */
    GetFinalMesh(scene: Scene): Mesh {
        return this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)];
    }

    extensionType = ".glb";

    /**
     * @param awsPath Path to the asset in AWS (including folder - eg. mechs/SilverbackMechOverall)
     * @param meshName The name of this specific mesh in the gltf - eg. SilverbackArms
     * @param materials An array of materials to use. Use null to keep the gltf material. MUST be same length as material num.
     * @param fileIndex optional if there are multiple files in the zip bundle
     */
    constructor(awsPath: string, meshName: string, materials: any[], fileIndex = 0, layerMask = 0x00000001) {
        super();
        this.fileIndex = fileIndex;
        this.desiredPath = awsPath;
        this.meshName = meshName;
        this.materials = materials;
        this.layerMask = layerMask;

        //Add to our mesh definitions so networked etc can find this definition
        const meshPath = awsPath + "_" + fileIndex;
        if (AllMDefinitions[meshPath] === undefined) {
            AllMDefinitions[meshPath] = {};
        }
        if (AllMDefinitions[meshPath][meshName] === undefined) {
            AllMDefinitions[meshPath][meshName] = [];
        }
    }

    /** Background cache as game is running to reduce asset load times */
    async GetBackgroundCacheTask(): Promise<string> {
        await GetSceneLoader(this.desiredPath, this.fileIndex, undefined).PerformBackgroundCache();
        return this.desiredPath;
    }

    /** Generic method for making sure mesh is loaded from AWS and performing the combine method on seperate elements */
    async loadInMesh(scene: Scene) {
        if (!this.desiredPath || this.desiredPath == "") {
            return;
        }
        if (!this.meshName || this.meshName == "") {
            return;
        }
        //Already loaded?
        if (this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] !== undefined) {
            return;
        }
        //In process of loading?
        else if (this.startedLoadingProcess === true) {
            await this.waitForMeshReadyEvent();
            return;
        }
        //Else not called before!
        this.startedLoadingProcess = true;

        //Start materials loading so they get a headstart - Note this assumes they will not change between now and setting them later
        const mats = [];
        for (var i = 0; i < this.materials.length; i++) {
            //If material was not overriden then set it so
            if (this.materials[i] !== null && this.materials[i] !== undefined) {
                mats.push(ExtractMaterialFromAny(this.materials[i], scene));
            } else {
                mats.push(null);
            }
        }

        //Check if a similar asset has loaded yet?
        if (AsyncStaticMeshDefinition.GetAsyncMeshLoader(scene, this.desiredPath, this.fileIndex) === undefined) {
            if (asyncMeshLoaders[GetAsyncSceneIdentifier(scene)] === undefined) {
                asyncMeshLoaders[GetAsyncSceneIdentifier(scene)] = {};
            }
            asyncMeshLoaders[GetAsyncSceneIdentifier(scene)][GetAssetFullPath(this.desiredPath, this.fileIndex)] =
                GetSceneLoader(this.desiredPath, this.fileIndex, scene);
            AsyncStaticMeshDefinition.GetAsyncMeshLoader(scene, this.desiredPath, this.fileIndex).extensionType =
                this.extensionType;
        }
        //Make sure actual mesh is loaded
        const asyncLoader = AsyncStaticMeshDefinition.GetAsyncMeshLoader(scene, this.desiredPath, this.fileIndex);
        await asyncLoader.getWaitForFullyLoadPromise();

        //Extract submeshes that we want
        var foundMeshElements = asyncLoader.extractMeshElements(this.meshName);

        //Validation
        if (foundMeshElements.length !== this.materials.length) {
            if (this.bNoFailMaterialDiff) {
                if (foundMeshElements.length > this.materials.length) {
                    for (var m = this.materials.length - 1; m < foundMeshElements.length; m++) {
                        this.materials.push(null);
                    }
                } else {
                    this.materials = this.materials.slice(0, foundMeshElements.length);
                }
            } else {
                console.error(
                    "Specified different number of materials for mesh: " +
                        this.meshName +
                        " in GLTF: " +
                        asyncLoader.requestedAssetPath +
                        ". Number of materials in GLTF: " +
                        foundMeshElements.length +
                        ". Number Specified: " +
                        this.materials.length +
                        ". Cancelling description creation."
                );
                this.setReplacementErrorBox(scene);
                return;
            }
        }

        //Change to specified materials
        for (var i = 0; i < mats.length; i++) {
            //If material was not overriden then set it so
            if (mats[i] !== null) {
                if (foundMeshElements[i].material !== null && foundMeshElements[i].material !== undefined) {
                    foundMeshElements[i].material.dispose();
                }
                foundMeshElements[i].material = mats[i];
            }
            //Else fill in the blank in our materials
            else {
                this.materials[i] = foundMeshElements[i].material;
            }
        }

        //Combine meshes?
        if (foundMeshElements.length === 0) {
            console.error("No meshes found for " + this.desiredPath);
            return;
        }
        if (foundMeshElements.length === 1) {
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] = (foundMeshElements[0] as Mesh).clone();
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)].makeGeometryUnique();
        } else {
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] = await Mesh.MergeMeshesAsync(
                foundMeshElements,
                true,
                false,
                undefined,
                false,
                true
            );
        }

        //Final check
        if (
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] === null ||
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] === undefined
        ) {
            console.error("Mesh did not combine properly for: " + this.meshName);
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] = MeshBuilder.CreateBox("ReplacementErrorBox");
            this.setReplacementErrorBox(scene);
            this.onMeshReady.notifyObservers(this);
            return;
        } else {
            //Set not visible so we can make clones and instances easily
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)].isVisible = false;
        }
        //Reset rotation
        const finalMesh = this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)];
        finalMesh.name = this.getNamePrefix() + this.desiredPath + "__" + this.meshName;
        const parent = finalMesh.parent;
        finalMesh.parent = null;
        finalMesh.rotation = new Vector3();
        finalMesh.position = new Vector3();
        finalMesh.scaling = new Vector3(1, 1, 1);
        finalMesh.layerMask = this.layerMask;
        if (parent !== null && parent.getChildren().length === 0) {
            parent.dispose();
        }

        //Completion and hand over for others
        this.onMeshReady.notifyObservers(this);
    }

    protected getNamePrefix(): string {
        return "";
    }

    /** If something went wrong just show a simple box */
    setReplacementErrorBox(scene: Scene) {
        if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light) {
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] = MeshBuilder.CreateBox("ReplacementErrorBox");
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)].material = GetBadMeshMaterial(scene);
        }
        this.onMeshReady.notifyObservers(this);
    }

    //** WARNING: Will return a unpopulated clone details. If wanting to wait then use await clone.getMeshCreatedPromise() */
    getMeshClone(scene: Scene, bStartVisible: boolean): StaticMeshCloneDetails {
        const newClone = new StaticMeshCloneDetails(this, bStartVisible, scene);
        this.populateMeshClone(newClone);
        return newClone;
    }

    protected async populateMeshClone(details: StaticMeshCloneDetails): Promise<null> {
        await this.loadInMesh(details.GetScene());
        const finalMesh = this.GetFinalMesh(details.GetScene());
        if (finalMesh !== null && finalMesh !== undefined) {
            details.createClone(true);
        }
        return null;
    }

    /** Instances that are CURRENTLY ACTIVE (not hidden etc) */
    meshInstances: {
        [sceneID: string]: { [index: number]: StaticMeshInstanceDetails };
    } = {};
    /** Instances that are in-between range and are available for use */
    availableMeshInstances: { [sceneID: string]: number[] } = {};
    //** WARNING: Will return a unpopulated instance details. If wanting to wait then use await instance.getMeshCreatedPromise() */
    getMeshInstance(scene: Scene, startVisible: boolean): StaticMeshInstanceDetails {
        const newDef = new StaticMeshInstanceDetails(this, startVisible, scene);
        const sceneID = GetAsyncSceneIdentifier(scene);
        if (this.meshInstances[sceneID] === undefined) {
            this.meshInstances[sceneID] = [];
            this.availableMeshInstances[sceneID] = [];
        }
        this.populateMeshInstance(newDef);
        return newDef;
    }

    protected async populateMeshInstance(details: StaticMeshInstanceDetails): Promise<null> {
        await this.loadInMesh(details.GetScene());
        this.GetFinalMesh(details.GetScene()).thinInstanceEnablePicking = true;
        details.instancePopulated();
        this.instanceChange(details);
        return null;
    }

    currentInstanceNum = 0;

    /** Called when we add/remove an instance so they have up to date information */
    instanceChange(details: StaticMeshInstanceDetails) {
        const scene = details.GetScene();
        const sceneID = GetAsyncSceneIdentifier(scene);
        var instances = this.meshInstances[sceneID];
        const finalMesh = this.GetFinalMesh(scene);
        if (finalMesh === undefined || finalMesh === null) {
            return;
        }
        if (instances === undefined || instances === null) {
            return;
        }
        const shouldbeshown = details.shouldMeshBeShown();
        const existingIndex = details.getInstanceIndex();

        //We are hiding as instance or deleting
        //Simply remove from instances as we are no longer wanting to display and another mesh could take its slot
        if (shouldbeshown === false && existingIndex !== -1) {
            instances[existingIndex] = undefined;
            this.availableMeshInstances[sceneID].push(existingIndex);
            details.setInstanceIndex(-1);
        }

        //Else we are adding?
        else if (shouldbeshown === true && existingIndex === -1) {
            const addInst = this.GetAvailableInstanceIndex(instances, sceneID);
            details.setInstanceIndex(addInst);
            instances[addInst] = details;
        }

        if (this.requireTransformResets.indexOf(scene) === -1) {
            this.requireTransformResets.push(scene);
        }
        if (UpdateRequireSMDefinitions.indexOf(this) === -1) {
            UpdateRequireSMDefinitions.push(this);
        }
    }

    private GetAvailableInstanceIndex(instances: any, sceneID: string): number {
        if (this.availableMeshInstances[sceneID].length > 0) {
            const val = this.availableMeshInstances[sceneID][0];
            this.availableMeshInstances[sceneID] = this.availableMeshInstances[sceneID].slice(
                1,
                this.availableMeshInstances[sceneID].length
            );
            return val;
        }
        return instances.length;
    }

    requireTransformResets: Scene[] = [];

    private TransformReset() {
        for (var i = 0; i < this.requireTransformResets.length; i++) {
            const scene = this.requireTransformResets[i];
            var instances = this.meshInstances[GetAsyncSceneIdentifier(scene)];
            const finalMesh = this.GetFinalMesh(scene);

            //Require add more instances?
            const numInstances = Object.keys(instances).length;
            if (numInstances > this.currentInstanceNum) {
                this.currentInstanceNum = GetMeshInstanceNum(numInstances);
            }

            //Set transforms
            var instanceLocations: InstancedMeshTransform[] = [];
            const hiddenTransform = new InstancedMeshTransform();
            hiddenTransform.location.y = 10000;
            for (var i = 0; i < this.currentInstanceNum; i++) {
                //set indexes on all instances
                if (instances[i] !== undefined) {
                    instanceLocations.push(instances[i].getInstanceTransform());
                } else {
                    instanceLocations.push(hiddenTransform);
                }
            }

            //update all transforms
            SetTransformArray(instanceLocations, finalMesh);

            //Update all colors
            this.colorUpdate(finalMesh, instances);

            finalMesh.isVisible = Object.keys(instances).length > 0;
        }
        this.requireTransformResets = [];
    }

    requireColorUpdate = false;
    private colorUpdate(mesh: Mesh, instances: { [index: number]: StaticMeshInstanceDetails }) {
        if (this.requireColorUpdate === false) {
            return;
        }
        //TODO: This will not work with multiple scenes
        var instanceColors: Float32Array = new Float32Array(4 * this.currentInstanceNum);
        for (var i = 0; i < this.currentInstanceNum; i++) {
            const offset = i * 4;
            var color = [0, 0, 0, 0];
            //set indexes on all instances
            if (instances[i] !== undefined) {
                color = instances[i].getInstanceColor();
            }
            try {
                instanceColors.set(color, offset);
            } catch {
                console.warn("Tried to set outside erorr");
            }
        }
        mesh.thinInstanceSetBuffer("color", instanceColors, 4);
        this.requireColorUpdate = false;
    }

    /** Updates all queued transform changes efficiently to their desired positions */
    UpdateQueuedTransformPositions() {
        this.TransformReset();
    }

    /** For testing purposes */
    ResetDefinitionParams() {
        this.finalCombinedMeshes = {};
        asyncMeshLoaders = {};
    }

    //Ready event for our knowledge
    private waitForMeshReadyEvent(): Promise<null> {
        var loader = this;
        return new Promise((resolve, reject) => {
            loader.onMeshReady.add(function () {
                resolve(null);
            });
        });
    }
}

/** Handy to generate a couple extra rather than needing more! */
export function GetMeshInstanceNum(currentLength: number) {
    if (currentLength < 5) {
        return 5;
    }
    if (currentLength < 12) {
        return 12;
    }
    if (currentLength < 20) {
        return 20;
    }
    if (currentLength < 50) {
        return 50;
    }
    console.warn("Require a lot of mesh instances: " + currentLength);
    return currentLength * 1.5;
}

export async function VerifyAllSMDefinitions(scene: Scene) {
    console.log("Verifying all SM Definitions. Look out for any Errors!");
    WipePreviouslyLoadedAsyncAssets();
    console.log("TODO Fix this!");
    // for (var i = 0; i < AllMDefinitions.length; i++) {
    //     AllMDefinitions[i].ResetDefinitionParams();
    //     AllMDefinitions[i].getMeshClone(scene,true).setClonePosition(new Vector3(-5, 0, 0));
    //     AllMDefinitions[i].getMeshInstance(scene,true).setInstancePosition(new Vector3(5, 0, 0));
    // }
}
