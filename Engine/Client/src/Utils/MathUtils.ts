import { Vector3, TransformNode, Vector2 } from "@babylonjs/core";
import { EntVector3 } from "../EntitySystem/CoreComponents";
const PI = 3.14159265359;
const DegToRad = 2 * PI;

export function RandomBoolean(): boolean {
    return Math.random() > 0.5;
}

export function Random1Minus1(): number {
    if (Math.random() > 0.5) {
        return 1;
    }
    return -1;
}

export function RadToAngle(angle: number) {
    return (angle * 360) / DegToRad;
}

export function AngleToRad(angle: number) {
    return (angle / 360) * DegToRad;
}

/** NOTE: This is in 2d and assumes root has no parent but WAAAY quicker than matrix */
export function convertWorldTolocal(loc: Vector3, root: TransformNode) {
    var ret = loc.subtract(root.position);
    ret = RotatePointAroundYAxis(ret, -root.rotation.y);
    return ret;
}

/** NOTE: This is in 2d and assumes root has no parent but WAAAY quicker than matrix */
export function convertLocToWorld(loc: Vector3, root: TransformNode) {
    var ret = RotatePointAroundYAxis(loc, -root.rotation.y);
    ret = root.position.subtract(ret);
    return ret;
}

export function RotatePointAroundYAxis(point: Vector3, angle: number) {
    var sinTheta = Math.sin(angle);
    var cosTheta = Math.cos(angle);
    var newX = point.x * cosTheta - point.z * sinTheta;
    var newZ = point.x * sinTheta + point.z * cosTheta;
    return new Vector3(newX, point.y, newZ);
}

export function Get2dDistance(A: Vector3, B: Vector3) {
    return Vector2.Distance(new Vector2(A.x, A.z), new Vector2(B.x, B.z));
}

export function Get2dDistanceSq(A: Vector3, B: Vector3) {
    return Vector2.DistanceSquared(new Vector2(A.x, A.z), new Vector2(B.x, B.z));
}

export function GetDistanceAlongLine(distanceX: number, distanceY: number): number {
    const distanceSquared = Math.pow(distanceX, 2) + Math.pow(distanceY, 2);
    const distanceAlongLine = Math.sqrt(distanceSquared);
    return distanceAlongLine;
}

export function Inside2dRadius(point: Vector3, center: Vector3, rad: number) {
    return Math.pow(point.x - center.x, 2) + Math.pow(point.z - center.z, 2) < Math.pow(rad, 2);
}

export function GetForwardVector(transform: TransformNode) {
    var xPos = Math.sin(transform.rotation.y * DegToRad) * Math.cos(transform.rotation.x * DegToRad);
    var yPos = Math.sin(-transform.rotation.x * DegToRad);
    var zPos = Math.cos(transform.rotation.x * DegToRad) * Math.cos(transform.rotation.y * DegToRad);

    return new Vector3(xPos, yPos, zPos);
}

export function Get2dEulerFromPoints(PointA: Vector3, PointB: Vector3) {
    var Copy = new Vector3(PointA.x, PointB.y, PointA.z);
    var Ret = GetEulerFromPoints(Copy, PointB);
    return Ret;
}

export function GetEulerFromPoints(PointA: Vector3, PointB: Vector3) {
    var DirVec = new Vector3(PointA.x - PointB.x, PointA.y - PointB.y, PointA.z - PointB.z);
    return GetEulerFromDirection(DirVec);
}

export function GetEulerFromDirection(direction: Vector3) {
    // Calculate yaw (rotation around the y-axis)
    let yaw = Math.atan2(direction.x, direction.z);

    // Calculate pitch (rotation around the x-axis)
    let pitch = Math.asin(direction.y / direction.length());

    // Return the Euler rotation as a Vector3
    return new Vector3(pitch, yaw, 0);
}

export function lerp(start: number, end: number, fract: number) {
    return (1 - fract) * start + fract * end;
}

//Returns 0-1 with 180 (behind) being 1 and 0 (or 360) being 0
export function NormalizeRotation(rot: number) {
    if (rot < 180) {
        return rot / 180;
    }
    return 1 - (rot - 180) / 180;
}

export function Clamp01(val: number): number {
    return Clamp(val, 0, 1);
}

export function Clamp(val: number, min: number, max: number) {
    if (val < min) {
        return min;
    }
    if (val > max) {
        return max;
    }
    return val;
}

export function MixVectors(vec1: Vector3, vec2: Vector3, ratio: number): Vector3 {
    // Calculate the linear interpolation of the two vectors
    let x = vec1.x * (1 - ratio) + vec2.x * ratio;
    let y = vec1.y * (1 - ratio) + vec2.y * ratio;
    let z = vec1.z * (1 - ratio) + vec2.z * ratio;

    // Return the mixed vector as a new Vector3 object
    return new Vector3(x, y, z);
}

export function RoundToNearestOdd(val: number, rnd: number) {
    var remainder = val / rnd;
    var rounded = Math.round(remainder);
    if (rounded % 2 === 0) {
        var absDiff = Math.abs(remainder);
        if (absDiff < 0.5) {
            return rounded + 1;
        } else {
            return rounded - 1;
        }
    } else {
        return rounded;
    }
}

export function DoBoundsOverlap(topLeftA: Vector2, ABounds: Vector2, topLeftB: Vector2, BBounds: Vector2): boolean {
    //Top Left
    if (IsPointInBounds(topLeftA, topLeftB, BBounds) === true) {
        return true;
    }
    //Bottom Left
    const bottomLeftPos = new Vector2(topLeftA.x, topLeftA.y + ABounds.y);
    if (IsPointInBounds(bottomLeftPos, topLeftB, BBounds) === true) {
        return true;
    }
    //Bottom Left
    const topRightPos = new Vector2(topLeftA.x + ABounds.x, topLeftA.y);
    if (IsPointInBounds(topRightPos, topLeftB, BBounds) === true) {
        return true;
    }
    //Bottom Right
    const bottomRightPos = new Vector2(topLeftA.x + ABounds.x, topLeftA.y + ABounds.y);
    if (IsPointInBounds(bottomRightPos, topLeftB, BBounds) === true) {
        return true;
    }
    return false;
}

export function IsPointInBounds(point: Vector2, itemTopLeft: Vector2, itemBounds: Vector2): boolean {
    //Outside to left top?
    if (point.x < itemTopLeft.x || point.y < itemTopLeft.y) {
        return false;
    }
    //Outside to right bottom?
    if (point.x > itemTopLeft.x + itemBounds.x || point.y > itemTopLeft.y + itemBounds.y) {
        return false;
    }
    return true;
}

/** Simple weighted average smoothing */
export function SimpleWeightedAverageSmooth(current: number, target: number, deltaTime: number, smoothingTime: number) {
    var steps = (1 / deltaTime) * smoothingTime;
    steps = Math.max(2, steps);
    return (current * (steps - 1) + target) / steps;
}

export function SimpleWeightedSmoothWithSteps(current: number, target: number, steps: number) {
    return (current * (steps - 1) + target) / steps;
}

/** Simple weighted average smoothing */
export function SimpleWeightedAverageSmoothVec3(
    current: Vector3,
    target: Vector3,
    deltaTime: number,
    smoothingTime: number
) {
    return new Vector3(
        SimpleWeightedAverageSmooth(current.x, target.x, deltaTime, smoothingTime),
        SimpleWeightedAverageSmooth(current.y, target.y, deltaTime, smoothingTime),
        SimpleWeightedAverageSmooth(current.z, target.z, deltaTime, smoothingTime)
    );
}

export function SimpleWeightedAverageSmoothEntVec3(
    current: EntVector3,
    target: EntVector3,
    deltaTime: number,
    smoothingTime: number
) {
    return new EntVector3(
        SimpleWeightedAverageSmooth(current.X, target.X, deltaTime, smoothingTime),
        SimpleWeightedAverageSmooth(current.Y, target.Y, deltaTime, smoothingTime),
        SimpleWeightedAverageSmooth(current.Z, target.Z, deltaTime, smoothingTime)
    );
}

export function NearlyEqual(a: number, b: number, epsilon = 0.001) {
    return Math.pow(a - b, 2) <= Math.pow(epsilon, 2);
}

export function ShuffleArray(array: any) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

export function* WeightedRandomIteration<T>(arr: T[], getWeight: (elem: T) => number) {
    // Calculate the total weight of the array
    let totalWeight = 0;
    for (let i = 0; i < arr.length; i++) {
        totalWeight += getWeight(arr[i]);
    }

    // Iterate through the array in a weighted random order
    let remaining = arr.slice(); // Make a copy of the array to avoid modifying the original
    while (remaining.length > 0) {
        // Choose a random element based on its weight
        let randomValue = Math.random() * totalWeight;
        let chosenIndex = -1;
        for (let i = 0; i < remaining.length; i++) {
            randomValue -= getWeight(remaining[i]);
            if (randomValue <= 0) {
                chosenIndex = i;
                break;
            }
        }
        if (chosenIndex < 0) {
            // If for some reason we didn't choose an index, choose one at random
            chosenIndex = Math.floor(Math.random() * remaining.length);
        }

        // Remove the chosen element from the remaining array and yield it
        const chosen = remaining[chosenIndex];
        remaining[chosenIndex] = remaining[remaining.length - 1];
        remaining.pop();
        totalWeight -= getWeight(chosen);
        yield chosen;
    }
}

export function RandomInRange(min: number, max: number) {
    return lerp(min, max, Math.random());
}

export function SnapToHalf(vector: Vector3): Vector3 {
    var halfX = Math.floor(vector.x * 2) / 2 + 0.5;
    const halfY = Math.floor(vector.y * 2) / 2 + 0.5;
    var halfZ = Math.floor(vector.z * 2) / 2 + 0.5;
    if (halfX % 1 === 0) {
        if (halfX - vector.x > 0) {
            halfX -= 0.5;
        } else {
            halfX += 0.5;
        }
    }
    if (halfZ % 1 === 0) {
        if (halfZ - vector.x < 0) {
            halfZ -= 0.5;
        } else {
            halfZ += 0.5;
        }
    }
    return new Vector3(halfX, halfY, halfZ);
}

export function SnapToFull(val: Vector3) {
    return new Vector3(Math.round(val.x / 1) * 1, 0, Math.round(val.z / 1) * 1);
}

export function SnapToNearest(value: number, n: number): number {
    return Math.round(value / n) * n;
}
