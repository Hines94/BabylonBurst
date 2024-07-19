import { BoundingBox, Material, Mesh, MultiMaterial, Observable, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { InstancedMeshTransform } from "./Utils/InstanceMeshUtils.js";
import { AsyncStaticMeshDefinition } from "./AsyncStaticMeshDefinition.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";

//This file contains clone,instance and description

//----------------------------------------------------------------------- CLONE --------------------------------------------------------------------------------
/**
 * Based from an AsyncStaticMeshDescription
 * Clone - can have seperate materials etc to owner, but less performant than a Instance
 */
export class StaticMeshCloneDetails {
    //The owning definition
    protected definition: AsyncStaticMeshDefinition;
    protected desiredScene: Scene = null;
    GetScene() {
        return this.desiredScene;
    }

    constructor(definition: AsyncStaticMeshDefinition, bStartVisible: boolean, scene: Scene) {
        this.bMeshVisible = bStartVisible;
        this.definition = definition;
        this.desiredScene = scene;
    }

    bCloneCreated = false;
    onCloneCreated = new Observable<StaticMeshCloneDetails>();

    /** MAY NOT EXIST since is Async. Use methods since they work async (eg setCloneTransform) */
    cloneMesh: Mesh = null;
    bMeshVisible = false;
    materials: Material[] = null;

    private desiredTransform = new InstancedMeshTransform();

    /**
     * For this clone set all new materials
     */
    setCloneMaterials(mats: Material[]) {
        if (mats === undefined || mats === null) {
            return;
        }
        if (this.materials !== null && mats.length !== this.materials.length) {
            console.error("Tried to set clone materials with incorrect number of materials!");
            return;
        }
        //If nothing anyway then no worries
        if (this.materials === null) {
            this.materials = mats;
        }
        //Else may feed in some nulls
        else {
            for (var i = 0; i < mats.length; i++) {
                if (mats[i] !== null) {
                    this.materials[i] = mats[i];
                }
            }
        }
        this.refreshMultiMat();
    }

    /**
     * For this clone set a new material for one of our submeshes
     */
    setCloneMaterialAtIndex(mat: Material, index: number) {
        if (index < 0 || index >= this.materials.length) {
            console.error("Passed invalid index for clone mesh!");
            return;
        }
        this.materials[index] = mat;
        this.refreshMultiMat();
    }

    /** Rebuilds our materials array into a multimat */
    private refreshMultiMat() {
        if (this.cloneMesh === null) {
            return;
        }
        var multimat = new MultiMaterial("CloneMultiMat", this.desiredScene);
        for (var i = 0; i < this.materials.length; i++) {
            multimat.subMaterials.push(this.materials[i]);
        }
        this.cloneMesh.material = multimat;
    }

    /**
     * Sets the transform and then updates this clone (works with Async)
     */
    setCloneTransform(transform: InstancedMeshTransform) {
        this.desiredTransform = transform;
        if (this.cloneMesh === null) {
            return;
        }
        this.cloneMesh.position = this.desiredTransform.location;
        this.cloneMesh.rotation = this.desiredTransform.rotation;
        this.cloneMesh.scaling = this.desiredTransform.scale;
    }

    /** Sets the position of our clone Only (no rot/scale) (works with Async) */
    setClonePosition(newPos: Vector3) {
        var clone = this.desiredTransform.clone();
        clone.location = newPos;
        this.setCloneTransform(clone);
    }

    /** Sets the rotation of our clone Only (no pos/scale) (works with Async) */
    setCloneRotation(newRot: Vector3 | Quaternion) {
        var clone = this.desiredTransform.clone();
        if(newRot instanceof Vector3) {
            clone.rotation = newRot;
        } else {
            clone.rotation = newRot.toEulerAngles();
        }
        this.setCloneTransform(clone);
    }

    /** Sets the scale of our clone Only (no rot/pos) (works with Async) */
    setCloneScale(newScale: Vector3) {
        var clone = this.desiredTransform.clone();
        clone.scale = newScale;
        this.setCloneTransform(clone);
    }

    /** Set if this mesh should be shown (works with Async) */
    setMeshVisible(bVisible: boolean) {
        this.bMeshVisible = bVisible;
        if (this.cloneMesh !== null) {
            this.cloneMesh.isVisible = bVisible;
        }
    }

    /** This is called when the master is loaded and our clone is ready */
    createClone() {
        if (this.bAwaitingDestroy === true) {
            return;
        }
        const finalMesh = this.definition.GetFinalMesh(this.desiredScene);
        this.cloneMesh = finalMesh.clone(finalMesh.name + "_clone");
        this.cloneMesh.isVisible = this.bMeshVisible;
        this.setCloneTransform(this.desiredTransform);

        if (this.materials !== null) {
            //Fill in any nulls from definition
            for (var i = 0; i < this.materials.length; i++) {
                if (this.materials[i] === null) {
                    this.materials[i] = this.definition.materials[i];
                }
            }
            this.refreshMultiMat();
        } else {
            this.materials = this.definition.materials;
        }

        this.notifyCloneCreated();
    }

    bAwaitingDestroy = false;
    /** If we no longer want the clone this method will neatly clean up */
    DestroyClone() {
        if (this.cloneMesh !== null) {
            this.cloneMesh.dispose();
        }
        this.bAwaitingDestroy = true;
    }

    dispose() {
        this.DestroyClone();
    }

    protected notifyCloneCreated() {
        this.bCloneCreated = true;
        this.onCloneCreated.notifyObservers(this);
    }

    //This will fire when we have loaded our asset and created an clone for this mesh
    getMeshCreatedPromise(): Promise<StaticMeshCloneDetails> {
        var loader = this;
        return new Promise((resolve, reject) => {
            if (loader.bCloneCreated === true) {
                resolve(loader);
            } else {
                loader.onCloneCreated.add(function () {
                    resolve(loader);
                });
            }
        });
    }
}

//----------------------------------------------------------------------- INSTANCE --------------------------------------------------------------------------------

/**
 * Contains information on an instance of an AsyncStaticMeshDescription
 * Use an instance if you want to keep the same material and have only color and transform variations
 */
export class StaticMeshInstanceDetails {
    private instanceColor: Color4;

    private desiredTransform = new InstancedMeshTransform();
    private desiredScene: Scene = null;
    GetScene() {
        return this.desiredScene;
    }

    //The owning definition
    private definition: AsyncStaticMeshDefinition;
    constructor(definition: AsyncStaticMeshDefinition, bStartVisible: boolean, scene: Scene) {
        this.bMeshVisible = bStartVisible;
        this.definition = definition;
        this.desiredScene = scene;
    }

    private instanceIndex = -1;
    setInstanceIndex(index: number) {
        this.instanceIndex = index;
    }
    getInstanceIndex() {
        return this.instanceIndex;
    }

    private bMeshVisible = true;

    bInstanceCreated = false;
    onInstanceCreated = new Observable<StaticMeshInstanceDetails>();
    onInstanceTransformChange = new Observable<StaticMeshInstanceDetails>();

    getMeshVisible(): boolean {
        return this.bMeshVisible;
    }

    /** Includes visibility */
    shouldMeshBeShown() {
        return this.bMeshVisible === true;
    }

    /** Will work even if the mesh is not loaded yet */
    setMeshVisible(bVisible: boolean) {
        if (this.bInDeletion === true) {
            return;
        }
        this.bMeshVisible = bVisible;
        if (this.instanceIndex === -1) {
            return;
        }
        this.definition.instanceChange(this);
    }

    //This is called when the master is loaded and our instance is ready
    instancePopulated() {
        if (this.bInDeletion === true) {
            return;
        }
        this.bInstanceCreated = true;
        if (this.instanceColor !== undefined) {
            this.definition.requireColorUpdate = true;
        }
        this.onInstanceCreated.notifyObservers(this);
        this.onInstanceTransformChange.notifyObservers(this);
        const sceneID = GetAsyncSceneIdentifier(this.GetScene());
    }

    setInstanceColor(color: Color4) {
        this.instanceColor = color;
        this.definition.requireColorUpdate = true;
    }

    getInstanceColor(): number[] {
        if (this.instanceColor === undefined) {
            return [0, 0, 0, 0];
        }
        return [this.instanceColor.r, this.instanceColor.g, this.instanceColor.b, this.instanceColor.a];
    }

    //This will fire when we have loaded our asset and created an instance for this mesh
    getInstanceCreatedPromise(): Promise<StaticMeshInstanceDetails> {
        var loader = this;
        return new Promise((resolve, reject) => {
            if (loader.bInstanceCreated === true) {
                resolve(loader);
            } else {
                loader.onInstanceCreated.add(function () {
                    resolve(loader);
                });
            }
        });
    }

    /**
     * Sets the transform and then updates this instance.
     * Set immediate change to true if you need pos to change now (for linecast etc)
     */
    setInstanceTransform(transform: InstancedMeshTransform, immediateChange = false) {
        this.desiredTransform = transform;
        if (this.instanceIndex === -1) {
            return;
        }
        if (this.shouldMeshBeShown() === false || this.bInDeletion === true) {
            return;
        }
        this.definition.instanceChange(this);
        if (immediateChange) {
            this.definition.UpdateQueuedTransformPositions();
        }
        this.onInstanceTransformChange.notifyObservers(this); //TODO: This before?
    }

    /** Sets the position of our instance Only (no rot/scale) */
    setInstancePosition(newPos: Vector3) {
        if (this.bInDeletion === true) {
            return;
        }
        var copy = this.desiredTransform.clone();
        copy.location = newPos;
        this.setInstanceTransform(copy);
    }

    /** Sets the rotation of our instance Only (no pos/scale) */
    setInstanceRotation(newRot: Vector3) {
        if (this.bInDeletion === true) {
            return;
        }
        var copy = this.desiredTransform.clone();
        copy.rotation = newRot;
        this.setInstanceTransform(copy);
    }

    /** Sets the scale of our instance Only (no rot/pos) */
    setInstanceScale(newScale: Vector3) {
        if (this.bInDeletion === true) {
            return;
        }
        var copy = this.desiredTransform.clone();
        copy.scale = newScale;
        this.setInstanceTransform(copy);
    }

    /** Get the transform of this mesh instance */
    getInstanceTransform(): InstancedMeshTransform {
        var ret = this.desiredTransform;
        if (this.shouldMeshBeShown() === false) {
            ret = this.desiredTransform.clone();
            ret.location = new Vector3(ret.location.x, ret.location.y + 10000, ret.location.z);
        }
        return ret;
    }

    getInstanceBoundingBox(): BoundingBox {
        var originalBoundingBox = this.definition.GetFinalMesh(this.desiredScene).getBoundingInfo().boundingBox;
        return originalBoundingBox;
    }

    getParentMesh(): Mesh {
        return this.definition.GetFinalMesh(this.desiredScene);
    }

    bInDeletion = false;
    /** Method for disposing of this instance and not requiring use anymore */
    dispose() {
        if (this.bInDeletion === true) {
            return;
        }
        if (this.bMeshVisible === true) {
            this.setMeshVisible(false);
        }
        //TODO remove other variables?
        this.bInDeletion = true;
    }
}
