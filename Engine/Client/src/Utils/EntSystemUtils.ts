import { Vector3 } from "@babylonjs/core";
import { serverConnection } from "../Networking/ServerConnection";
import { EntVector4 } from "@engine/EntitySystem/CoreComponents";

export enum AxisType {
    ForwardAxis,
    BackwardAxis,
    RightAxis,
    LeftAxis,
    UpAxis,
    DownAxis,
}

export function GetNormalizedAxisForEntRotation(rotation: EntVector4, axisType: AxisType): Vector3 {
    const mat = quaternionToMatrix(rotation);
    switch (axisType) {
        case AxisType.ForwardAxis:
            return new Vector3(mat[0][2], mat[1][2], mat[2][2]).normalize();
        case AxisType.BackwardAxis:
            return new Vector3(-mat[0][2], -mat[1][2], -mat[2][2]).normalize();
        case AxisType.LeftAxis:
            return new Vector3(mat[0][0], mat[1][0], mat[2][0]).normalize();
        case AxisType.RightAxis:
            return new Vector3(-mat[0][0], -mat[1][0], -mat[2][0]).normalize();
        case AxisType.UpAxis:
            return new Vector3(mat[0][1], mat[1][1], mat[2][1]).normalize();
        case AxisType.DownAxis:
            return new Vector3(-mat[0][1], -mat[1][1], -mat[2][1]).normalize();
        default:
            return Vector3.Zero();
    }
}

export function GetAbsNormalizedAxisForEntRotation(rotation: EntVector4, axisType: AxisType): Vector3 {
    const ret = GetNormalizedAxisForEntRotation(rotation, axisType);
    if (ret.x < 0) {
        ret.x = -ret.x;
    }
    if (ret.y < 0) {
        ret.y = -ret.y;
    }
    if (ret.z < 0) {
        ret.z = -ret.z;
    }
    return ret;
}

function quaternionToMatrix(quaternion: EntVector4): number[][] {
    const xx = quaternion.X * quaternion.X;
    const yy = quaternion.Y * quaternion.Y;
    const zz = quaternion.Z * quaternion.Z;
    const xy = quaternion.X * quaternion.Y;
    const xz = quaternion.X * quaternion.Z;
    const yz = quaternion.Y * quaternion.Z;
    const wx = quaternion.W * quaternion.X;
    const wy = quaternion.W * quaternion.Y;
    const wz = quaternion.W * quaternion.Z;

    return [
        [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
        [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
        [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
    ];
}

export function GetLocalPlayerId(): string {
    if (serverConnection === undefined) {
        return "Local";
    }
    console.log("TODO:");
    return undefined;
}
