import { Scene, Vector4 } from "@babylonjs/core";
import { AsyncSkeletalMeshDefinition } from "./AsyncSkeletalMesh";
import { runStaticMeshTransformSystem } from "./AsyncStaticMeshInstanceRunner";
import { InstancedMeshTransform } from "./Utils/InstanceMeshUtils";
import { StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { EntityQuery } from "../EntitySystem/EntityQuery";
import { SkeletalAnimationSpecifier } from "../Rendering/InstancedRender";

export class AsyncSkeletalMeshInstanceRunner extends AsyncSkeletalMeshDefinition {
    //Instance change no longer does anything as we are running system as a whole
    override instanceChange(details: StaticMeshInstanceDetails): void {}

    lastRun = 0;
    /** Change all transforms for this specific mesh */
    RunTransformSystem(scene: Scene, values: InstancedMeshTransform[],query:EntityQuery) {
        runStaticMeshTransformSystem(scene,values,this);
        const dt = (performance.now()-this.lastRun)/1000;
        this.lastRun = performance.now();
        //Animation stuff
        if(this.GetFinalMesh(scene) && this.instanceVertexData) {
            const animParameters = new Float32Array(this.currentInstanceNum * 4);
            var e = 0;
            const params = new Vector4(0,0,0,0);

            // Set data for entities
            query.iterateEntities(e=>{
                const anim = e.GetComponent(SkeletalAnimationSpecifier);
                if(anim.AnimationName && this.animationRanges[anim.AnimationName]) {
                    // Get animation from definition
                    const data = this.animationRanges[anim.AnimationName];
                    anim.currentFrame += dt*anim.playRate*data.framerate;
                    const maxF = data.from-data.to;
                    if(anim.currentFrame > maxF) {
                        if(anim.Loop) anim.currentFrame = Math.max(anim.currentFrame%maxF,1);
                        else anim.currentFrame = maxF-1;
                    }
                    params.set(data.from,data.to,anim.currentFrame + data.from,data.framerate)
     
                } else { params.setAll(0);}
                animParameters.set(params.asArray(),i*4);
            })

            for(var i = e; i < this.currentInstanceNum; i++) {
                animParameters.set(params.asArray(),i*4);
            }
            this.GetFinalMesh(scene).thinInstanceSetBuffer("bakedVertexAnimationSettingsInstanced", animParameters, 4);
        }

    }

    protected override getNamePrefix(): string {
        return "SkelInstRunner_";
    }
}