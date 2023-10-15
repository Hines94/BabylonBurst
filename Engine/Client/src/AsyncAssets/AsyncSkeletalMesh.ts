import { Skeleton, AnimationRange, VertexAnimationBaker, BakedVertexAnimationManager, Scene } from "@babylonjs/core";
import { StaticMeshCloneDetails, StaticMeshInstanceDetails } from "./AsyncStaticMesh.js";
import { AsyncStaticMeshDefinition } from "./AsyncStaticMeshDefinition.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";

/*
 * This is an extension of the static mesh classes and allows us to easily access specific skeletal mesh functionality.
 */

// /** A static mesh Instance. Can't change any materials on this instance. */
// export class SkeletalMeshInstanceDetails extends StaticMeshInstanceDetails {
//TODO https://playground.babylonjs.com/#CP2RN9#20
//FOR NOW: Does not exist. In future simply animated objects may use this.
// }

/** A skeletal mesh clone. Comes with a copy of the original skeleton.
 *  Currently used for ALL skeletal meshes.
 */
export class SkeletalMeshCloneDetails extends StaticMeshCloneDetails {
    private tempSkeleton: Skeleton = null;

    override createClone(bNotifyComplete: boolean) {
        //If the skeletal is not valid then just return
        if ((this.definition as AsyncSkeletalMeshDefinition).verifySkeletalMeshDefinition(this.GetScene()) === false) {
            return;
        }
        //Create static mesh clone
        super.createClone(false);

        //Skeletal specific options
        const LoadedScene = AsyncStaticMeshDefinition.GetAsyncMeshLoader(
            this.GetScene(),
            this.definition.desiredPath,
            this.definition.fileName
        ).loadedGLTF;

        this.tempSkeleton = LoadedScene.skeletons[0].clone("Clone_" + LoadedScene.skeletons[0].name);
        this.cloneMesh.skeleton = this.tempSkeleton;

        //Regular notify after skeletal setup
        this.notifyCloneCreated();
    }

    override DestroyClone() {
        super.DestroyClone();
        if (this.tempSkeleton !== null) {
            this.tempSkeleton.dispose();
        }
    }

    /**
     * Apply a new skeleton to the clone mesh
     * @param skel desired skeleton
     */
    applyNewSkeleton(skel: Skeleton) {
        if (skel === this.tempSkeleton) {
            return;
        }
        if (this.tempSkeleton !== null) {
            this.tempSkeleton.dispose();
            this.tempSkeleton = null;
        }
        this.cloneMesh.skeleton = skel;
    }

    GetAnimationRangeByName(name: string, bWarn = true) {
        const anims = (this.definition as AsyncSkeletalMeshDefinition).getAnimationData();
        for (var i = 0; i < anims.length; i++) {
            if (anims[i].name === name) {
                return anims[i];
            }
        }
        if (bWarn)
            console.warn("Can't find animation range by name: " + name + " this mesh: " + this.definition.meshName);
        return null;
    }

    GetAllAnimationRanges(): AnimationRange[] {
        return (this.definition as AsyncSkeletalMeshDefinition).getAnimationData();
    }
}

/** Skeletal mesh version of async. */
export class AsyncSkeletalMeshDefinition extends AsyncStaticMeshDefinition {
    /** So our scene loader knows which extension to use */
    extensionType = ".babylon";
    instanceVertexData: Float32Array = null;

    override getMeshClone(scene: Scene, bStartVisible: boolean): SkeletalMeshCloneDetails {
        const newClone = new SkeletalMeshCloneDetails(this, bStartVisible, scene);
        this.populateMeshClone(newClone);
        return newClone;
    }

    // override getMeshInstance(scene: Scene,startVisible: boolean): StaticMeshInstanceDetails {
    //     const newDef = new SkeletalMeshInstanceDetails(this, startVisible,scene);
    //     this.meshInstances.push(newDef);
    //     this.populateMeshInstance(newDef);
    //     return newDef;
    // }

    protected async populateMeshInstance(details: StaticMeshInstanceDetails): Promise<null> {
        await super.populateMeshInstance(details);
        if (this.instanceVertexData === null) {
            await this.bakeVertexAnimationData(details.GetScene());
        }
        return null;
    }

    /** Will bake out our animation data so we can play animations on instances */
    private async bakeVertexAnimationData(scene: Scene) {
        const baker = new VertexAnimationBaker(scene, this.GetFinalMesh(scene));
        this.instanceVertexData = await baker.bakeVertexData(this.getAnimationData());
        const vertexTexture = baker.textureFromBakedVertexData(this.instanceVertexData);
        const manager = new BakedVertexAnimationManager(scene);
        manager.texture = vertexTexture;
        this.GetFinalMesh(scene).bakedVertexAnimationManager = manager;
    }

    /** Verifies that the skeletal mesh defi that we made is correct! */
    verifySkeletalMeshDefinition(scene: Scene): boolean {
        const asyncLoader = AsyncStaticMeshDefinition.GetAsyncMeshLoader(scene, this.desiredPath, this.fileName);
        const LoadedScene = asyncLoader.loadedGLTF;
        if (LoadedScene.skeletons.length === 0) {
            console.error(
                "No skeletons found in the GLTF scene for " +
                    this.desiredPath +
                    ". Require ONE (only) for importing skeletal meshes"
            );
            return false;
        } else if (LoadedScene.skeletons.length > 1) {
            console.error(
                "Multiple skeletons found in the GLTF scene for " +
                    this.desiredPath +
                    ". Async loading works with ONE only!"
            );
            return false;
        }
        return true;
    }

    /** Retrieve all animations from our GLTF */
    getAnimationData(): AnimationRange[] {
        return this.getFirstFinalMesh().skeleton.getAnimationRanges();
    }

    /** Get the skeleton in our original mesh */
    getMeshSkeleton(): Skeleton {
        return this.getFirstFinalMesh().skeleton;
    }

    protected getFirstFinalMesh() {
        const keys = Object.keys(this.finalCombinedMeshes);
        return this.finalCombinedMeshes[keys[0]];
    }
}
