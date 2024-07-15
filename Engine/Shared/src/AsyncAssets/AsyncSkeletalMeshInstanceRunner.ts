import { Scene, Vector4 } from "@babylonjs/core";
import { AsyncSkeletalMeshDefinition } from "./AsyncSkeletalMesh";
import { runStaticMeshTransformSystem } from "./AsyncStaticMeshInstanceRunner";
import { InstancedMeshTransform } from "./Utils/InstanceMeshUtils";
import { StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { EntityQuery } from "../EntitySystem/EntityQuery";
import { SkeletalAnimationSpecifier } from "../Rendering/InstancedRender";
import { Clamp } from "../Utils/MathUtils";

export class AsyncSkeletalMeshInstanceRunner extends AsyncSkeletalMeshDefinition {
    //Instance change no longer does anything as we are running system as a whole
    override instanceChange(details: StaticMeshInstanceDetails): void {}
    priorParams:Float32Array;
    /** Change all transforms for this specific mesh */
    RunTransformSystem(scene: Scene, values: InstancedMeshTransform[],query:EntityQuery,deltaTime:number) {
        if(!runStaticMeshTransformSystem(scene,values,this)) return;
        //Animation stuff
        if(!this.GetFinalMesh(scene) || !this.instanceVertexData) return;
        this.manager.time += deltaTime;
        const animParameters = new Float32Array(this.currentInstanceNum * 4);
        var i = 0;
        const params = new Vector4(0,0,0,0);

        // Set data for entities
        query.iterateEntities(e=>{
            const anim = e.GetComponent(SkeletalAnimationSpecifier);
            if(anim.AnimationName && this.animationRanges[anim.AnimationName]) {
                // Get animation from definition
                const data = this.animationRanges[anim.AnimationName];
                if(anim.bRandomOffsetFrame && anim.frameOffset ==0) {
                    anim.frameOffset = Math.random()*data.to-data.from;
                }
                params.set(data.from,data.to,anim.frameOffset,data.framerate)
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