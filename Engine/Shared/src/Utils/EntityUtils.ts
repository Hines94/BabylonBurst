import { BoundingBox, Matrix, MeshBuilder, Ray, Vector3 } from "@babylonjs/core";
import { EntityData } from "../EntitySystem/EntityData";
import { EntTransform, EntVector3, EntVector4 } from "../EntitySystem/CoreComponents";

function calculateAABB(width, height, depth, rotationMatrix) {
    let halfExtents = new Vector3(width / 2, height / 2, depth / 2);
    let corners = [
        new Vector3(-halfExtents.x, -halfExtents.y, -halfExtents.z),
        new Vector3( halfExtents.x, -halfExtents.y, -halfExtents.z),
        // ... other 6 corners ...
    ];

    let transformedCorners = corners.map(corner => Vector3.TransformCoordinates(corner, rotationMatrix));
    let min = transformedCorners[0].clone();
    let max = transformedCorners[0].clone();

    transformedCorners.forEach(corner => {
        min = Vector3.Minimize(min, corner);
        max = Vector3.Maximize(max, corner);
    });

    return { min: min, max: max };
}

/** Given a function to get our box, find the nearest entity under the ray. ENTITIES MUST HAVE TRANSFORM! */
export function BoxRaycastForNearestEntity(entities:EntityData[],ray:Ray,getBoxSize:(ent:EntityData)=>{width:number,height:number,depth:number}): EntityData {
    var nearest:EntityData;
    var nearestDistance = 100000000000000;


    const rayTest = MeshBuilder.CreateBox("Ray test");
    entities.forEach(e=>{
        //TODO: Elmintate those that are clearly out? Use partitioning system once that is in place

        const transformComp = e.GetComponent(EntTransform);
        const rotMatrix = Matrix.Identity();
        Matrix.FromQuaternionToRef(EntVector4.GetQuaternion(transformComp.Rotation),rotMatrix);

        const boxParams = getBoxSize(e);

        //Quick bound check before performing expensive mesh check
        const position = new Vector3(transformComp.Position.X,transformComp.Position.Y + (boxParams.height/2),transformComp.Position.Z);
        const width = boxParams.width
        const depth = boxParams.depth;
        const height = boxParams.height;

        //TODO: Fix bounding ox for increased efficiency 
        // const minmax = calculateAABB(width,height,depth,rotMatrix);

        // const min = new Vector3(position.x + minmax.min.x, position.y + minmax.min.y, position.z + minmax.min.z);
        // const max = new Vector3(position.x + minmax.max.x, position.y + minmax.max.y, position.z + minmax.max.z);
        // const boundBox = new BoundingBox(min,max);
    
        // if(ray.intersectsBox(boundBox) === false) {
        //     return;
        // }

        //Full ray check
        rayTest.position = position;
        rayTest.scaling.x = width;
        rayTest.scaling.y = height;
        rayTest.scaling.z = depth;
        rayTest.rotation = EntVector3.GetVector3(EntVector4.QuaternionToEuler(transformComp.Rotation));
        rayTest.computeWorldMatrix(true);
        const pickInfo = ray.intersectsMesh(rayTest);
        if(pickInfo.hit) {
            if(pickInfo.distance < nearestDistance) {
                nearest = e;
                nearestDistance = pickInfo.distance;
            } 
        }
    })
    rayTest.dispose();


    if(nearest) {
        return nearest;
    }
    return undefined;
}

/** Given a function to get our box, find the nearest entity under the ray. ENTITIES MUST HAVE TRANSFORM! */
export function BoxRaycastForAllEntities(entities:EntityData[],ray:Ray,getBoxSize:(ent:EntityData)=>{width:number,height:number,depth:number}): EntityData[] {
    const hitEntities: { entity: EntityData; distance: number }[] = [];


    const rayTest = MeshBuilder.CreateBox("Ray test");
    entities.forEach(e => {
        //TODO: Elmintate those that are clearly out? Use partitioning system once that is in place

        const transformComp = e.GetComponent(EntTransform);
        const rotMatrix = Matrix.Identity();
        Matrix.FromQuaternionToRef(EntVector4.GetQuaternion(transformComp.Rotation),rotMatrix);

        const boxParams = getBoxSize(e);
        const position = new Vector3(transformComp.Position.X,transformComp.Position.Y + (boxParams.height/2),transformComp.Position.Z);
        const width = boxParams.width
        const depth = boxParams.depth;
        const height = boxParams.height;

        //TODO: Quick bound check before performing expensive mesh check

        // Full ray check
        rayTest.position = position;
        rayTest.scaling.x = width;
        rayTest.scaling.y = height;
        rayTest.scaling.z = depth;
        rayTest.rotation = EntVector3.GetVector3(EntVector4.QuaternionToEuler(transformComp.Rotation));
        rayTest.computeWorldMatrix(true);
        const pickInfo = ray.intersectsMesh(rayTest);

        if (pickInfo.hit) {
            hitEntities.push({ entity: e, distance: pickInfo.distance });
        }
    });
    rayTest.dispose();

    // Sort the hit entities by distance
    hitEntities.sort((a, b) => a.distance - b.distance);

    // Extract just the entities from the sorted array
    return hitEntities.map(hit => hit.entity);
}

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
