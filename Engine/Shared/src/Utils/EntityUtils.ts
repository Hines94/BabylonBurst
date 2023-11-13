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