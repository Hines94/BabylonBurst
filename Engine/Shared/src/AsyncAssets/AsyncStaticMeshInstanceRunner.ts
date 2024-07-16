import { Mesh, Scene } from "@babylonjs/core";;
import { AsyncStaticMeshDefinition, GetMeshInstanceNum } from "./AsyncStaticMeshDefinition";
import { GetInstanceLocations, InstancedMeshTransform, SetTransformArray } from "./Utils/InstanceMeshUtils";
import { EntityQuery } from "../EntitySystem/EntityQuery";
import { StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils";

/**
 * Similar to a static mesh definition but is purpose built to run instance meshes with entity systems
 * NOTE: AsyncStaticMeshDefinition style instances will not work!
 */
export class AsyncStaticMeshInstanceRunner extends AsyncStaticMeshDefinition {
    //Instance change no longer does anything as we are running system as a whole
    override instanceChange(details: StaticMeshInstanceDetails): void {}

    /** Change all transforms for this specific mesh */
    RunTransformSystem(scene: Scene, values: InstancedMeshTransform[]) {
        runStaticMeshTransformSystem(scene,values,this);
    }

    protected override getNamePrefix(): string {
        return "InstRunner_";
    }
}

//TODO: Colours and other custom data too?
// private colorUpdate(mesh:Mesh, instances:{[index:number]:StaticMeshInstanceDetails}){
//     if(this.requireColorUpdate === false){return;}
//     //TODO: This will not work with multiple scenes
//     var instanceColors:Float32Array = new Float32Array(4 * this.currentInstanceNum);
//     for (var i = 0; i < this.currentInstanceNum ; i++) {
//         const offset = i*4;
//         var color = [0,0,0,0];
//         //set indexes on all instances
//         if(instances[i] !== undefined){
//             color = instances[i].getInstanceColor();
//         }
//         try{instanceColors.set(color,offset);}
//         catch{console.warn("Tried to set outside erorr");}
//     }
//     mesh.thinInstanceSetBuffer("color",instanceColors,4);
//     this.requireColorUpdate = false;
// }

export function runStaticMeshTransformSystem(scene: Scene, values: InstancedMeshTransform[],system:AsyncStaticMeshDefinition) {
    const finalMesh = system.GetFinalMesh(scene);
    if (finalMesh === undefined) {
        if(values.length === 0) {
            return false;
        }
        system.loadInMesh(scene);
        return false;
    }
    if(!system.finishedLoadingProcess[GetAsyncSceneIdentifier(scene)]) return;

    if(values.length === 0) {
        finalMesh.isVisible = false;
        return false;
    }

    //Require add more instances?
    if (values.length > system.currentInstanceNum) {
        system.currentInstanceNum = GetMeshInstanceNum(values.length);
    }

    var instanceLocations: InstancedMeshTransform[] = GetInstanceLocations(values,system.currentInstanceNum);

    //update all transforms
    SetTransformArray(instanceLocations,finalMesh);
    finalMesh.isVisible = values.length > 0;

    return true;
}