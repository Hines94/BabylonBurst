import { Scene, Vector4 } from "@babylonjs/core";
import { AsyncSkeletalMeshDefinition } from "./AsyncSkeletalMesh";
import { StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { InstancedMeshTransform } from "./Utils/InstanceMeshUtils";
import { IColourable, runStaticMeshColorSystem, runStaticMeshTransformSystem } from "./AsyncStaticMeshInstanceRunner";

export interface SkeletalData {
    //TODO: Loop or non loop
    AnimationName:string;
    playRate:number;
    frameOffset:number;
}

export class AsyncSkeletalMeshInstanceRunner extends AsyncSkeletalMeshDefinition {
    //Instance change no longer does anything as we are running system as a whole
    override instanceChange(details: StaticMeshInstanceDetails): void {}
    priorParams:Float32Array;

    /** Exact copy of static */
    RunTransformSystem(scene: Scene, values: InstancedMeshTransform[], colours:IColourable[]) {
        runStaticMeshTransformSystem(scene,values,this);
        runStaticMeshColorSystem(this.GetFinalMesh(scene),colours,this);
    }

    RunAnimationSystem(scene:Scene,skeletalData:SkeletalData[],deltaTime:number) {
        if(!this.GetFinalMesh(scene) || !this.instanceVertexData) return;
        this.manager.time += deltaTime;
        const animParameters = new Float32Array(this.currentInstanceNum * 4);
        var i = 0;
        const params = new Vector4(0,0,0,0);

        // Set data for entities
        skeletalData.forEach(anim=>{         
            if(anim.AnimationName && this.animationRanges[anim.AnimationName]) {
                // Get animation from definition
                const data = this.animationRanges[anim.AnimationName];
                params.set(data.from+1,data.to,anim.frameOffset,data.framerate)
            } else { params.setAll(0);}
            animParameters.set(params.asArray(),i*4);
            i++;
        })
        if(this.priorParams != animParameters) this.GetFinalMesh(scene).thinInstanceSetBuffer("bakedVertexAnimationSettingsInstanced", animParameters, 4);  
    }

    protected override getNamePrefix(): string {
        return "SkelInstRunner_";
    }
}