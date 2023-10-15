import { EntVector3, EntVector4 } from "./CoreComponents";

export class EntBoxCheck {
    center: EntVector3;
    size: EntVector3;
    rotation: EntVector4;

    constructor(center: EntVector3, size: EntVector3, rotation: EntVector4) {
        this.center = center;
        this.size = size;
        this.rotation = rotation;
    }

    static IsPointWithinBox(point: EntVector3, bounds: EntBoxCheck) {
        // Translate the point to the box's local coordinate system
        const localPoint: EntVector3 = {
            X: point.X - bounds.center.X,
            Y: point.Y - bounds.center.Y,
            Z: point.Z - bounds.center.Z,
        };

        // Rotate the point so the box appears axis-aligned
        const rotatedPoint = localPoint; //EntVector4.MultiplyVector(localPoint,EntVector4.Inverse(bounds.rotation)); // Assumes quaternion class has these methods

        // Perform the axis-aligned box check
        return (
            rotatedPoint.X >= -bounds.size.X / 2 &&
            rotatedPoint.X <= bounds.size.X / 2 &&
            rotatedPoint.Y >= -bounds.size.Y / 2 &&
            rotatedPoint.Y <= bounds.size.Y / 2 &&
            rotatedPoint.Z >= -bounds.size.Z / 2 &&
            rotatedPoint.Z <= bounds.size.Z / 2
        );
    }

    static IsColliderWithinBox(worldTris: EntVector3[][], box: EntBoxCheck) {
        for (var t = 0; t < worldTris.length; t++) {
            for (var v = 0; v < 3; v++) {
                if (EntBoxCheck.IsPointWithinBox(worldTris[t][v], box)) {
                    return true;
                }
            }
        }
        return false;
    }
}
