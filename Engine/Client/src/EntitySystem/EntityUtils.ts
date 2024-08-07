import { Mesh, VertexBuffer } from "@babylonjs/core";
import { StaticMeshCloneDetails } from "@BabylonBurstCore/AsyncAssets";
import { EntTransform, EntVector3, EntVector4 } from "@BabylonBurstCore/EntitySystem/CoreComponents";

export type RaycastFind = {
    distance: number;
    raycastPos: EntVector3;
    transform: EntTransform;
    entityId: number;
    normal: EntVector3;
};

export function SetCloneToTransform(clone: StaticMeshCloneDetails, transform: EntTransform) {
    clone.setClonePosition(EntVector3.GetVector3(transform.Position));
    clone.setCloneRotation(EntVector3.GetVector3(EntVector4.QuaternionToEuler(transform.Rotation)));
    clone.setCloneScale(EntVector3.GetVector3(EntVector3.MultiplyFloat(transform.Scale, 1.001)));
}

export function SetMeshToTransform(mesh: Mesh, transform: EntTransform) {
    if (mesh === undefined || mesh === null) {
        return;
    }
    mesh.position = EntVector3.GetVector3(transform.Position);
    mesh.rotation = EntVector3.GetVector3(EntVector4.QuaternionToEuler(transform.Rotation));
    mesh.scaling = EntVector3.GetVector3(EntVector3.MultiplyFloat(transform.Scale, 1.001));
}

export function GetMeshTriangles(mesh: Mesh) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

    // Convert the vertices data into Vector3 objects
    const colliderVertices = [];
    for (let i = 0; i < positions.length; i += 3) {
        colliderVertices.push(new EntVector3(positions[i], positions[i + 1], positions[i + 2]));
    }

    // Get the triangle indices
    const indices = mesh.getIndices();

    // Convert the triangle indices into Vector3 arrays
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
        triangles.push([
            colliderVertices[indices[i]],
            colliderVertices[indices[i + 1]],
            colliderVertices[indices[i + 2]],
        ]);
    }
    return triangles;
}

export function EntTransformToMat4(transform: EntTransform): number[][] {
    const pos = transform.Position;
    const rot = transform.Rotation;
    const scale = transform.Scale;

    const qx = rot.X;
    const qy = rot.Y;
    const qz = rot.Z;
    const qw = rot.W;

    const x2 = qx + qx;
    const y2 = qy + qy;
    const z2 = qz + qz;

    const xx = qx * x2;
    const xy = qx * y2;
    const xz = qx * z2;

    const yy = qy * y2;
    const yz = qy * z2;
    const zz = qz * z2;

    const wx = qw * x2;
    const wy = qw * y2;
    const wz = qw * z2;

    const sx = scale.X;
    const sy = scale.Y;
    const sz = scale.Z;

    return [
        [(1 - (yy + zz)) * sx, (xy - wz) * sy, (xz + wy) * sz, pos.X],
        [(xy + wz) * sx, (1 - (xx + zz)) * sy, (yz - wx) * sz, pos.Y],
        [(xz - wy) * sx, (yz + wx) * sy, (1 - (xx + yy)) * sz, pos.Z],
        [0, 0, 0, 1],
    ];
}

export function MultiplyMat4Vec3(mat: number[][], vec: EntVector3): EntVector3 {
    const x = vec.X;
    const y = vec.Y;
    const z = vec.Z;

    return {
        X: mat[0][0] * x + mat[0][1] * y + mat[0][2] * z + mat[0][3],
        Y: mat[1][0] * x + mat[1][1] * y + mat[1][2] * z + mat[1][3],
        Z: mat[2][0] * x + mat[2][1] * y + mat[2][2] * z + mat[2][3],
    };
}
