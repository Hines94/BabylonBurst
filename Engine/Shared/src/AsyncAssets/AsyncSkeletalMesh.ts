import { Skeleton, AnimationRange, VertexAnimationBaker, BakedVertexAnimationManager, Scene, Mesh, AnimationGroup, Vector3 } from "@babylonjs/core";
import { AsyncStaticMeshDefinition } from "./AsyncStaticMeshDefinition";
import { SceneAsyncLoader } from "./SceneAsyncLoader";
import { StaticMeshCloneDetails } from "./AsyncStaticMesh";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils";



//TODO: This needs to be fixed!

/*
 * This is an extension of the static mesh classes and allows us to easily access specific skeletal mesh functionality.
 */

// /** A static mesh Instance. Can't change any materials on this instance. */
// export class SkeletalMeshInstanceDetails extends StaticMeshInstanceDetails {
//TODO https://playground.babylonjs.com/#CP2RN9#20
//FOR NOW: Does not exist. In future simply animated objects may use this.
// }

/** A skeletal mesh clone. Comes with a copy of the original skeleton.*/
export class SkeletalMeshCloneDetails extends StaticMeshCloneDetails {
    animations:AnimationGroup[];
    skeleton:Skeleton;

    async generateFromLoadedData(asyncLoader:SceneAsyncLoader) {
        const eles = asyncLoader.importMeshesToScene(this.definition.meshName)
        if(eles.skels.length !== 1) {
            console.error('Require one skeleton only for ' + this.definition.meshName);
            return;
        }

        this.skeleton = eles.skels[0];
        this.cloneMesh = await Mesh.MergeMeshesAsync(
            //@ts-ignore
            eles.meshes,
            true,
            false,
            undefined,
            false,
            true
        );
        eles.meshes.forEach(m=>m.dispose())
        this.cloneMesh.skeleton = this.skeleton;
        this.animations = eles.anims;

        this.notifyCloneCreated();
    }
}

async function bakeVertexData(mesh:Mesh, ags:AnimationGroup[]) {
    ags.forEach((ag) => ag.stop());
    const s = mesh.skeleton;
    const boneCount = s.bones.length;
    //const relevantAnims = ags.reduce((ag)=> ag.)
    /** total number of frames in our animations */
    const frameCount = ags.reduce((acc, ag) => acc + (Math.floor(ag.to) - Math.floor(ag.from)) + 1, 0);

    // reset our loop data
    let textureIndex = 0;
    const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
    const vertexData = new Float32Array(textureSize);

    function* captureFrame() {
        const skeletonMatrices = s.getTransformMatrices(mesh);
        vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);
    }
    mesh.isVisible = true;
    let ii = 0;
    for (const ag of ags) {
        ag.reset();
        const from = Math.floor(ag.from);
        const to = Math.floor(ag.to);
        for (let frameIndex = from; frameIndex <= to; frameIndex++) {
            if (ii++ === 0) continue;
            // start anim for one frame
            ag.start(false, 1, frameIndex, frameIndex, false);
            // wait for finishing TODO: Make this faster! run in one frame and hide whilst running!?
            await ag.onAnimationEndObservable.runCoroutineAsync(captureFrame());
            textureIndex++;
            // stop anim
            ag.stop();
        }
    }
    
    return vertexData;
}

export class AnimationDetails extends AnimationRange {
    framerate = 60;
    
    constructor(name: string, from: number, to: number, framerate: number) {
        super(name,from,to);
        this.framerate = framerate;
    }
}

/** Skeletal mesh version of async. */
export class AsyncSkeletalMeshDefinition extends AsyncStaticMeshDefinition {
    /** So our scene loader knows which extension to use */
    extensionType = ".glb";
    instanceVertexData: Float32Array = null;
    skeleton:Skeleton;

    protected animationRanges:{[id:string]:AnimationDetails} = {};

    override getMeshClone(scene: Scene, bStartVisible: boolean): SkeletalMeshCloneDetails {
        const newClone = new SkeletalMeshCloneDetails(this, bStartVisible, scene);
        this.populateMeshClone(newClone);
        return newClone;
    }

    override async populateMeshClone(details: SkeletalMeshCloneDetails): Promise<void> {
        // Instantiate and merge a new mesh
        const asyncLoader = SceneAsyncLoader.GetAsyncSceneLoader(details.GetScene(), this.desiredPath, this.fileName,this.extensionType);
        await asyncLoader.getWaitForFullyLoadPromise();
        details.generateFromLoadedData(asyncLoader);
    }

    override async preMeshReady(scene:Scene,foundMeshElements:Mesh[],asyncLoader:SceneAsyncLoader): Promise<void> {
        const final = this.GetFinalMesh(scene);
        final.skeleton = foundMeshElements[0].skeleton;
        this.skeleton = final.skeleton;
        //TODO: Check all skeletons are the same
        if(!this.verifySkeletalMeshDefinition(foundMeshElements)) {
            return;
        }
        if (this.instanceVertexData === null) {
            await this.bakeVertexAnimationData(scene,asyncLoader);
        }
    }
    
    manager:BakedVertexAnimationManager;
    /** Will bake out our animation data so we can play animations on instances */
    private async bakeVertexAnimationData(scene: Scene,asyncLoader:SceneAsyncLoader) {
        const finalMesh = this.GetFinalMesh(scene);
        //finalMesh.position = new Vector3(-1000,-1000,-1000); TODO: Hide whilst baking somehow
        const baker = new VertexAnimationBaker(scene, finalMesh);
        
        //Setup ranges
        var latest = 0;
        asyncLoader.container.animationGroups.forEach(ag=>{
            //TODO: Check is the same skeleton!
            if(!ag.targetedAnimations[0]) return;
            this.animationRanges[ag.name] = new AnimationDetails(ag.name,latest,latest+ag.to,ag.targetedAnimations[0].animation.framePerSecond);
            latest+=ag.to;
        })
        
        // Bake in animation data
        this.instanceVertexData = await bakeVertexData(finalMesh,asyncLoader.container.animationGroups);
        const vertexTexture = baker.textureFromBakedVertexData(this.instanceVertexData);
        this.manager = new BakedVertexAnimationManager(scene);
        this.manager.texture = vertexTexture;
        finalMesh.bakedVertexAnimationManager = this.manager;
        //finalMesh.position = new Vector3(1000,1000,1000);
    }

    /** Verifies that the skeletal mesh defi that we made is correct! */
    private verifySkeletalMeshDefinition(loadedMeshes:Mesh[]): boolean {
        //TODO: Change this to all meshes sharing the same skeleton
        const skels = [];
        var allSkels = true;
        loadedMeshes.forEach(s=>{
            if(!s.skeleton) {allSkels = false; return;}
            if(!skels.includes(s.skeleton)) skels.push(s.skeleton);
        })

        if(!allSkels) {
            console.error(
                "Not all meshes have a skeleton for GLB skeletal mesh definition " +
                    this.desiredPath +
                    ". Require all meshes to have the same skeleton"
            );
            return false;
        }

        if(skels.length === 0) {
            console.error(
                "No skeletons for for GLB skeletal mesh definition " +
                    this.desiredPath +
                    ". Require at least one skele."
            );
            return false;
        }
        
        if(skels.length > 1) {
            console.error(
                "Multiple skeletons for for GLB skeletal mesh definition " +
                    this.desiredPath +
                    ". Require JUST one skeleton for a definition"
            );
            return false;
        }

        return true;
    }


    /** Get the skeleton in our original mesh */
    getMeshSkeleton(): Skeleton {
        return this.getFirstFinalMesh().skeleton;
    }

    GetAnimRange(anim:string) {
        return this.animationRanges[anim];
    }

    protected getFirstFinalMesh() {
        const keys = Object.keys(this.finalCombinedMeshes);
        return this.finalCombinedMeshes[keys[0]];
    }
}
