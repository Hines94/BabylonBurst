import { Mesh, Scene } from "@babylonjs/core";;
import { AsyncStaticMeshDefinition, GetMeshInstanceNum } from "./AsyncStaticMeshDefinition";
import { GetInstanceLocations, InstancedMeshTransform, SetTransformArray } from "./Utils/InstanceMeshUtils";
import { EntityQuery } from "../EntitySystem/EntityQuery";
import { StaticMeshInstanceDetails } from "./AsyncStaticMesh";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils";
import { EntVector4 } from "../EntitySystem/CoreComponents";

export interface IColourable {
    currentColor:EntVector4;
}

/**
 * Similar to a static mesh definition but is purpose built to run instance meshes with entity systems
 * NOTE: AsyncStaticMeshDefinition style instances will not work!
 */
export class AsyncStaticMeshInstanceRunner extends AsyncStaticMeshDefinition {
    //Instance change no longer does anything as we are running system as a whole
    override instanceChange(details: StaticMeshInstanceDetails): void {}

    /** Change all transforms for this specific mesh */
    RunTransformSystem(scene: Scene, values: InstancedMeshTransform[], colours:IColourable[]) {
        runStaticMeshTransformSystem(scene,values,this);
        runStaticMeshColorSystem(this.GetFinalMesh(scene), colours,this);
    }

    protected override getNamePrefix(): string {
        return "InstRunner_";
    }
}

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

// Colours TODO: other custom data too?
export function runStaticMeshColorSystem(mesh:Mesh, colours:IColourable[],system:AsyncStaticMeshDefinition){
    if(!mesh){return;}
    var instanceColors:Float32Array = new Float32Array(GetMeshInstanceNum(colours.length)*4);
    var same = system.priorColors === undefined ? system.priorColors.length === instanceColors.length : true;
    for (var i = 0; i < colours.length ; i++) {
        const offset = i*4;
        var color = colours[i];
        instanceColors[offset] = color.currentColor.X;
        instanceColors[offset+1] = color.currentColor.Y;
        instanceColors[offset+2] = color.currentColor.Z;
        instanceColors[offset+3] = color.currentColor.W;
    }
    if(system.priorColors && same) {
        for(var j = 0; j < system.priorColors.length; j++) {
            if(instanceColors[j] !== system.priorColors[j]) {
                same=false;
                break;
            }
        }
    }

    if(same) return;
    mesh.thinInstanceSetBuffer("color", instanceColors, 4);
    system.priorColors = instanceColors;
}