import { Matrix, Mesh, Quaternion, Vector3 } from "@babylonjs/core";

const ThinArrayMatrixOffset = 16;

//A group of utilities that can be handy for creating instanced meshes
export class InstancedMeshTransform {
    location = new Vector3(0, 0, 0);
    rotation = new Vector3(0, 0, 0);
    scale = new Vector3(1, 1, 1);

    constructor(loc:Vector3 = undefined,rot:Vector3 = undefined,scale:Vector3 = undefined){
        if(loc !== undefined){this.location = loc;}
        if(rot !== undefined){this.rotation = rot;}
        if(scale !== undefined){this.scale = scale;}
    }

    clone(): InstancedMeshTransform {
        var copy = new InstancedMeshTransform();
        copy.location = new Vector3().copyFrom(this.location);
        copy.rotation = new Vector3().copyFrom(this.rotation);
        copy.scale = new Vector3().copyFrom(this.scale);
        return copy;
    }

    getMatrix() {
        var Quat = Quaternion.FromEulerAngles(this.rotation.x, this.rotation.y, this.rotation.z);
        var m = Matrix.Compose(this.scale, Quat, this.location);
        return m;
    }

    setValuesForTransform(array: Float32Array,offset: number){
        var Quat = Quaternion.FromEulerAngles(this.rotation.x, this.rotation.y, this.rotation.z);
        Matrix.Compose(this.scale, Quat, this.location).copyToArray(array,offset);
    }
}

export function SetTransformArray(instanceTransforms: InstancedMeshTransform[], mesh: Mesh) {
    var bufferMatrices = new Float32Array(ThinArrayMatrixOffset * instanceTransforms.length);

    for (var i = 0; i < instanceTransforms.length; i++) {
        instanceTransforms[i].setValuesForTransform(bufferMatrices, i * ThinArrayMatrixOffset);
    }

    mesh.thinInstanceSetBuffer("matrix", bufferMatrices);
}

export function SetTransformAtIndex(transform: InstancedMeshTransform, mesh: Mesh, index: number,refreshInstances = false) {
    mesh.thinInstanceSetMatrixAt(index, transform.getMatrix(),refreshInstances);
}