import { Camera, Engine, Quaternion, Scene, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import { lerp } from "../../../Shared/src/Utils/MathUtils";

export function localToWorldRotation(rotation: Vector3, translationNode: TransformNode): Vector3 {
    let worldRotation = Quaternion.FromEulerAngles(
        translationNode.rotation.x,
        translationNode.rotation.y,
        translationNode.rotation.z
    );
    let localRotation = Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z);
    let newRotation = worldRotation.multiply(localRotation);
    return newRotation.toEulerAngles();
}

export function GetRandomPositionInRadius(position: Vector3, radius: number): Vector3 {
    let angle = Math.random() * Math.PI * 2;
    let distance = Math.random() * radius;
    let x = position.x + distance * Math.cos(angle);
    let z = position.z + distance * Math.sin(angle);
    return new Vector3(x, position.y, z);
}

export function GetRandomPositionInRadiusRange(
    position: Vector3,
    minRadius: number,
    maxRadius: number,
    maxAngle = Math.PI * 2
): Vector3 {
    let angle = Math.random() * maxAngle;
    let distance = lerp(minRadius, maxRadius, Math.random());
    let x = position.x + distance * Math.cos(angle);
    let z = position.z + distance * Math.sin(angle);
    return new Vector3(x, position.y, z);
}

export function WaitForTime(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export function RayPlaneIntersection(
    rayOrigin: Vector3,
    rayDirection: Vector3,
    planePoint: Vector3,
    planeNormal: Vector3
): Vector3 | null {
    const denominator = Vector3.Dot(planeNormal, rayDirection);

    if (Math.abs(denominator) < 1e-6) {
        // The ray is parallel to the plane, so there is no intersection
        return null;
    }

    const t = Vector3.Dot(planeNormal, planePoint.subtract(rayOrigin)) / denominator;

    if (t < 0) {
        // The intersection is behind the ray's origin
        return null;
    }

    // Calculate the intersection point
    const intersectionPoint = rayOrigin.add(rayDirection.scale(t));
    return intersectionPoint;
}

export function GetCirclePositions(position: Vector3, radius: number, segments: number): Vector3[] {
    let angleDelta = (2 * Math.PI) / segments;
    let circlePositions: Vector3[] = [];
    for (let i = 0; i < segments; i++) {
        let angle = i * angleDelta;
        let x = position.x + radius * Math.cos(angle);
        let y = position.y;
        let z = position.z + radius * Math.sin(angle);
        circlePositions.push(new Vector3(x, y, z));
    }
    return circlePositions;
}

export function Delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function DisposeOfObject(ob: any) {
    const thisKeys = Object.keys(ob);
    for (var i = 0; i < thisKeys.length; i++) {
        const key = thisKeys[i];
        if (ob[key] !== undefined && ob[key] !== null && typeof ob[key] === "object" && Array.isArray(ob[key])) {
            for (var j = 0; j < ob[key].length; j++) {
                TryCallDispose(ob[key][j]);
            }
        } else {
            TryCallDispose(ob[key]);
        }

        //@ts-ignore
        delete ob[key];
    }
}

export function TryCallDispose(ob: any) {
    if (ob !== undefined && ob !== null && typeof ob === "object" && typeof ob.dispose === "function") {
        ob.dispose();
    }
}

export function BlendDirections(direction1: Vector3, direction2: Vector3, strength: number): Vector3 {
    const x1 = direction1.x;
    const z1 = direction1.z;
    const x2 = direction2.x;
    const z2 = direction2.z;

    // Calculate the blended x and z components
    const blendedX = x1 * (1 - strength) + x2 * strength;
    const blendedZ = z1 * (1 - strength) + z2 * strength;

    // Create and return a new Vector3 with the blended components and a y value of 0
    return new Vector3(blendedX, 0, blendedZ).normalize();
}

export function LocalToWorldQuat(localEuler: Vector3, parentRotation: Quaternion): Quaternion {
    // Convert the local Euler rotation to a Quaternion
    const localQuaternion = Quaternion.RotationYawPitchRoll(localEuler.y, localEuler.x, localEuler.z);

    // Multiply the local Quaternion by the parent rotation Quaternion to get the world rotation Quaternion
    return parentRotation.multiply(localQuaternion);
}

export function GetDirectionFromEulerRotation(rotation: Vector3): Vector3 {
    const quaternion = Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z);
    const direction = new Vector3(0, 0, 1).rotateByQuaternionToRef(quaternion, new Vector3());
    direction.normalize();
    return direction;
}

export function GetNormalizedDot(dir: Vector3, dir2: Vector3): number {
    const dot = Vector3.Dot(dir2, dir);
    const normDot = 1 - (dot + 1) / 2;
    return normDot;
}

export function SetupOrthographicCamera(cam: Camera, distance: number) {
    const scene = cam.getScene();
    cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
    var aspect =
        scene.getEngine().getRenderingCanvasClientRect().height /
        scene.getEngine().getRenderingCanvasClientRect().width;
    cam.orthoLeft = -distance / 2;
    cam.orthoRight = distance / 2;
    cam.orthoBottom = cam.orthoLeft * aspect;
    cam.orthoTop = cam.orthoRight * aspect;
}

export function GetMousePosAccountLock(scene: Scene) {
    if (IsPointerLockActive()) {
        return GetScreenMiddle(scene);
    } else {
        return new Vector2(scene.pointerX, scene.pointerY);
    }
}

export function GetScreenMiddle(scene: Scene) {
    const eng = scene.getEngine();
    const scaling = eng._hardwareScalingLevel;
    return new Vector2((eng.getRenderWidth() * scaling) / 2, (eng.getRenderHeight() * scaling) / 2);
}

export function IsPointerLockActive() {
    const pointerLockElement = document.pointerLockElement; //|| document.mozPointerLockElement || document.webkitPointerLockElement; TODO other browsers
    return pointerLockElement !== null;
}

export function EnterPointerLock(eng: Engine) {
    var canvas = eng.getRenderingCanvas();
    //canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}

export function ExitPointerLock() {
    //document.exitPointerLock = document.exitPointerLock || document.msExitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }
}
