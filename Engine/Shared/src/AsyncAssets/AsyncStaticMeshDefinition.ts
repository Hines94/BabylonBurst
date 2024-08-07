import { Material, Mesh, MeshBuilder, Observable, Scene, StandardMaterial } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { ExtractMaterialFromAny } from "./AsyncMaterial";
import { WipePreviouslyLoadedAsyncAssets } from "./Framework/AsyncAssetLoader";
import { SceneAsyncLoader } from "./SceneAsyncLoader";
import { InstancedMeshTransform, SetTransformArray, SetTransformAtIndex } from "./Utils/InstanceMeshUtils";
import { GetAsyncSceneIdentifier, GetBadMeshMaterial } from "./Utils/SceneUtils";
import { GetAssetFullPath, GetZipPath } from "./Utils/ZipUtils";
import { DebugMode, environmentVaraibleTracker } from "../Utils/EnvironmentVariableTracker";
import { StaticMeshCloneDetails, StaticMeshInstanceDetails } from "./AsyncStaticMesh";

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

/**
 * Should contain information on Materials and submeshes that will be combined to one mesh from our GLB on AWS.
 * From here we can create either an instance or clone.
 */
export class AsyncStaticMeshDefinition {
    desiredPath: string;
    onMeshReady = new Observable<AsyncStaticMeshDefinition>();
    startedLoadingProcess:{[sceneId:string]:boolean} = {};
    finishedLoadingProcess:{[sceneId:string]:boolean} = {};
    /** Set to true if we want to accept different number of materials input vs actual mesh */
    bNoFailMaterialDiff = false;

    //Details on this definition
    meshName: string;
    materials: any[];
    fileName: string;
    layerMask: number;

    /** Final combined meshes for each scene */
    protected finalCombinedMeshes: { [sceneid: string]: Mesh } = {};
    /** Get the final mesh after all submeshes have been combined */
    GetFinalMesh(scene: Scene): Mesh {
        return this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)];
    }

    extensionType = ".glb";

    /**
     * @param awsPath Path to the asset bundle in AWS (including folder - eg. levels/levelAData)
     * @param meshName The name of this specific mesh in the GLB - eg. SilverbackArms
     * @param materials An array of materials to use. Use null to keep the GLB material. MUST be same length as material num.
     * @param fileName Name of the file that contains our mesh
     */
    constructor(awsPath: string, meshName: string, materials: any[], fileName: string, layerMask = 0x00000001) {
        this.fileName = fileName;
        this.desiredPath = awsPath;
        this.meshName = meshName;
        this.materials = materials;
        this.layerMask = layerMask;
    }

    static blankDefinitions:{[id:string]:AsyncStaticMeshDefinition} = {};

    /** More efficient than using a new AsyncStaticMeshDefinition() */
    static GetStaticMeshDefinitionNoMats(awsPath: string, meshName: string, fileName: string) {
        if(this.blankDefinitions[awsPath+meshName+fileName] === undefined) {
            this.blankDefinitions[awsPath+meshName+fileName] = new AsyncStaticMeshDefinition(awsPath,meshName,[],fileName);
            this.blankDefinitions[awsPath+meshName+fileName].bNoFailMaterialDiff = true;
        }
        return this.blankDefinitions[awsPath+meshName+fileName];
    }

    /** Generic method for making sure mesh is loaded from AWS and performing the combine method on seperate elements */
    async loadInMesh(scene: Scene) {
        if (!this.desiredPath || this.desiredPath == "") {
            return;
        }
        if (!this.meshName || this.meshName == "") {
            return;
        }
        const sceneId = GetAsyncSceneIdentifier(scene);
        //Already loaded?
        if (this.finalCombinedMeshes[sceneId] !== undefined) {
            return;
        }
        //In process of loading?
        else if (this.startedLoadingProcess[sceneId] === true) {
            await this.waitForMeshReadyEvent();
            return;
        }
        //Else not called before!
        this.startedLoadingProcess[sceneId] = true;

        //Start materials loading so they get a headstart - Note this assumes they will not change between now and setting them later
        var matInstances = [];
        for (var i = 0; i < this.materials.length; i++) {
            //If material was not overriden then set it so
            if (this.materials[i] !== null && this.materials[i] !== undefined) {
                matInstances.push(ExtractMaterialFromAny(this.materials[i], scene));
            } else {
                matInstances.push(null);
            }
        }

        //Make sure actual mesh is loaded
        const asyncLoader = SceneAsyncLoader.GetAsyncSceneLoader(scene, this.desiredPath, this.fileName,this.extensionType);
        await asyncLoader.getWaitForFullyLoadPromise();

        //Extract submeshes that we want
        var foundMeshElements = asyncLoader.extractMeshElements(this.meshName);

        //Mat Validation
        if (foundMeshElements.length !== matInstances.length) {
            var backupMat = null;
            const warnMessage = `Specified different number of materials for mesh: ${this.meshName}. in GLB: ${asyncLoader.requestedAssetPath}. Number of materials in GLB: ${foundMeshElements.length}. Number Specified: ${this.materials.length}`;
            if (!this.bNoFailMaterialDiff) {
                backupMat = GetBadMeshMaterial(scene);
                console.error(warnMessage);
            } else {
                console.warn(warnMessage);
            }

            if (foundMeshElements.length > matInstances.length) {
                for (var m = matInstances.length; m < foundMeshElements.length; m++) {
                    matInstances[m]=backupMat;
                }
            } else {
                matInstances = matInstances.slice(0, foundMeshElements.length);
            }
        }

        //Change to specified materials
        for (var i = 0; i < matInstances.length; i++) {
            if(!foundMeshElements[i]['OriginalMaterial']) foundMeshElements[i]['OriginalMaterial']=foundMeshElements[i].material
            //If material was not overriden then set it so
            if (matInstances[i] !== null) {
                foundMeshElements[i].material = matInstances[i];
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
                false,
                false,
                undefined,
                false,
                true
            );
        }

        //Reset mesh elements to original material
        for(var i = 0; i < foundMeshElements.length;i++) {
            foundMeshElements[i].material = foundMeshElements[i]['OriginalMaterial'];
        }

        //Final check
        if (
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] === null ||
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] === undefined
        ) {
            console.error("Mesh did not combine properly for: " + this.meshName);
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
        await this.preMeshReady(scene,foundMeshElements,asyncLoader);

        //Completion and hand over for others
        this.finishedLoadingProcess[sceneId] = true;
        this.onMeshReady.notifyObservers(this);
    }

    async preMeshReady(scene:Scene,foundMeshElements:Mesh[],asyncLoader:SceneAsyncLoader):Promise<void> {}

    protected getNamePrefix(): string {
        return "";
    }

    /** If something went wrong just show a simple box */
    setReplacementErrorBox(scene: Scene) {
        if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light) {
            this.finalCombinedMeshes[GetAsyncSceneIdentifier(scene)] = MeshBuilder.CreateBox("ReplacementErrorBox",{},scene);
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

    protected async populateMeshClone(details: StaticMeshCloneDetails): Promise<void> {
        await this.loadInMesh(details.GetScene());
        const finalMesh = this.GetFinalMesh(details.GetScene());
        if (finalMesh !== null && finalMesh !== undefined) {
            details.createClone();
        }
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

    priorColors:Float32Array;
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

var warned=false;
const checks = [5,12,15,25,50,100,200];
/** Handy to generate a couple extra rather than needing more! */
export function GetMeshInstanceNum(currentLength: number) {
    for(var i = 0; i < checks.length;i++) {
        if(currentLength < checks[i]) {
            return checks[i];
        }
    }
    if(!warned){
        console.warn("Require a lot of mesh instances: " + currentLength);
        warned=true;
    }
    checks.push(currentLength * 1.5);
    return checks[checks.length-1];
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
