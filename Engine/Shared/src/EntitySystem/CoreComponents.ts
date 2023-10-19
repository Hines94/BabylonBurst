import { AbstractMesh, Matrix, Quaternion, Vector3, Vector4 } from "@babylonjs/core";
import { Clamp } from "../Utils/MathUtils";
import { RegisteredType, Saved } from "./TypeRegister";
import { Component, TrackedVariable } from "./Component";

@RegisteredType(EntVector3)
export class EntVector3{
    @Saved(Number)
    X: number = 0;
    @Saved(Number)
    Y: number = 0;
    @Saved(Number)
    Z: number = 0;

    constructor(X: number = undefined, Y: number = undefined, Z: number = undefined) {
        if (X !== undefined) {
            this.X = X;
        }
        if (Y !== undefined) {
            this.Y = Y;
        }
        if (Z !== undefined) {
            this.Z = Z;
        }
    }

    static GetVector3(ev: EntVector3) {
        return new Vector3(ev.X, ev.Y, ev.Z);
    }

    static Equals(a: EntVector3, b: EntVector3, margin: number = 0.01): boolean {
        const sqMargin = Math.pow(margin, 2);
        if (Math.pow(a.X - b.X, 2) > sqMargin) {
            return false;
        }
        if (Math.pow(a.Y - b.Y, 2) > sqMargin) {
            return false;
        }
        if (Math.pow(a.Z - b.Z, 2) > sqMargin) {
            return false;
        }
        return true;
    }

    static Lerp(a: EntVector3, b: EntVector3, t: number): EntVector3 {
        const result = new EntVector3();
        result.X = a.X + (b.X - a.X) * t;
        result.Y = a.Y + (b.Y - a.Y) * t;
        result.Z = a.Z + (b.Z - a.Z) * t;
        return result;
    }

    static VectorToEnt(vec: Vector3) {
        const ret = new EntVector3();
        ret.X = vec.x;
        ret.Y = vec.y;
        ret.Z = vec.z;
        return ret;
    }

    static CompareTo(a: EntVector3, b: EntVector3): number {
        if (a.X < b.X) {
            return -1;
        } else if (a.X > b.X) {
            return 1;
        } else {
            if (a.Y < b.Y) {
                return -1;
            } else if (a.Y > b.Y) {
                return 1;
            } else {
                if (a.Z < b.Z) {
                    return -1;
                } else if (a.Z > b.Z) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    }

    static DistanceSq(vecA: EntVector3, vecB: EntVector3) {
        return Math.pow(vecA.X - vecB.X, 2) + Math.pow(vecA.Y - vecB.Y, 2) + Math.pow(vecA.Z - vecB.Z, 2);
    }

    static Subtract(vecA: EntVector3, vecB: EntVector3) {
        return new EntVector3(vecA.X - vecB.X, vecA.Y - vecB.Y, vecA.Z - vecB.Z);
    }

    static Add(vecA: EntVector3, vecB: EntVector3) {
        return new EntVector3(vecA.X + vecB.X, vecA.Y + vecB.Y, vecA.Z + vecB.Z);
    }

    static Length(vecA: EntVector3) {
        return Math.abs(vecA.X) + Math.abs(vecA.Y) + Math.abs(vecA.Z);
    }

    static Dot(vec1: EntVector3, vec2: EntVector3) {
        return vec1.X * vec2.X + vec1.Y * vec2.Y + vec1.Z * vec2.Z;
    }

    static Multiply(vec1: EntVector3, vec2: EntVector3) {
        return new EntVector3(vec1.X * vec2.X, vec1.Y * vec2.Y, vec1.Z * vec2.Z);
    }

    static Normalize(vector: EntVector3): EntVector3 {
        const length = Math.sqrt(vector.X * vector.X + vector.Y * vector.Y + vector.Z * vector.Z);
        const X = vector.X / length;
        const Y = vector.Y / length;
        const Z = vector.Z / length;

        return new EntVector3(X, Y, Z);
    }

    static clone(v: EntVector3) {
        return new EntVector3(v.X, v.Y, v.Z);
    }

    static Cross(a: EntVector3, b: EntVector3): EntVector3 {
        const X = a.Y * b.Z - a.Z * b.Y;
        const Y = a.Z * b.X - a.X * b.Z;
        const Z = a.X * b.Y - a.Y * b.X;

        return new EntVector3(X, Y, Z);
    }

    static RotateDirectionByQuaternion(vector: EntVector3, quaternion: EntVector4): EntVector3 {
        // Convert the direction vector to a quaternion with a zero W component
        const vectorQuaternion = new EntVector4(vector.X, vector.Y, vector.Z, 0);

        // Multiply the rotation quaternion by the direction quaternion
        const temp = EntVector4.Multiply(quaternion, vectorQuaternion);

        // Multiply the result by the conjugate of the rotation quaternion
        const result = EntVector4.Multiply(temp, EntVector4.Conjugate(quaternion));

        // Convert the resulting quaternion back to a vector
        const rotatedVector = new EntVector3(result.X, result.Y, result.Z);

        return rotatedVector;
    }

    static RotatePositionByQuaternion(position: EntVector3, quaternion: EntVector4) {
        // Convert the position vector to a quaternion with a zero W component
        const positionQuaternion = new EntVector4(position.X, position.Y, position.Z, 0);

        // Multiply the rotation quaternion by the position quaternion, then multiply the result by the conjugate of the rotation quaternion
        const result = EntVector4.Multiply(
            EntVector4.Multiply(quaternion, positionQuaternion),
            EntVector4.Conjugate(quaternion)
        );

        // Convert the resulting quaternion back to a vector
        const rotatedPosition = new EntVector3(result.X, result.Y, result.Z);

        return rotatedPosition;
    }

    static MultiplyFloat(val: EntVector3, float: number): EntVector3 {
        return new EntVector3(val.X * float, val.Y * float, val.Z * float);
    }
}

@RegisteredType(EntVector4)
export class EntVector4 {
    @Saved(Number)
    X: number = 0;
    @Saved(Number)
    Y: number = 0;
    @Saved(Number)
    Z: number = 0;
    @Saved(Number)
    W: number = 1;

    constructor(X: number = undefined, Y: number = undefined, Z: number = undefined, W: number = undefined) {
        if (X !== undefined) {
            this.X = X;
        }
        if (Y !== undefined) {
            this.Y = Y;
        }
        if (Z !== undefined) {
            this.Z = Z;
        }
        if (W !== undefined) {
            this.W = W;
        }
    }

    static slerp(left: EntVector4, right: EntVector4, amount: number): EntVector4 {
        let num2;
        let num3;
        let num4 = left.X * right.X + left.Y * right.Y + left.Z * right.Z + left.W * right.W;
        let flag = false;

        if (num4 < 0) {
            flag = true;
            num4 = -num4;
        }

        if (num4 > 0.999999) {
            num3 = 1 - amount;
            num2 = flag ? -amount : amount;
        } else {
            const num5 = Math.acos(num4);
            const num6 = 1.0 / Math.sin(num5);
            num3 = Math.sin((1.0 - amount) * num5) * num6;
            num2 = flag ? -Math.sin(amount * num5) * num6 : Math.sin(amount * num5) * num6;
        }

        const result = new EntVector4();
        result.X = num3 * left.X + num2 * right.X;
        result.Y = num3 * left.Y + num2 * right.Y;
        result.Z = num3 * left.Z + num2 * right.Z;
        result.W = num3 * left.W + num2 * right.W;
        return result;
    }

    static Subtract(a: EntVector4, b: EntVector4) {
        return new EntVector4(a.X - b.X, a.Y - b.Y, a.Z - b.Z, a.W - b.W);
    }

    static clone(val: EntVector4) {
        return new EntVector4(val.X, val.Y, val.Z, val.W);
    }

    static Equals(a: EntVector4, b: EntVector4, margin: number = 0.01): boolean {
        const sqMargin = Math.pow(margin, 2);
        if (Math.pow(a.X - b.X, 2) > sqMargin) {
            return false;
        }
        if (Math.pow(a.Y - b.Y, 2) > sqMargin) {
            return false;
        }
        if (Math.pow(a.Z - b.Z, 2) > sqMargin) {
            return false;
        }
        if (Math.pow(a.W - b.W, 2) > sqMargin) {
            return false;
        }
        return true;
    }

    static GetVector4(ev: EntVector4) {
        return new Vector4(ev.X, ev.Y, ev.Z, ev.W);
    }

    static GetQuaternion(ev: EntVector4) {
        return new Quaternion(ev.X, ev.Y, ev.Z, ev.W);
    }

    static QuatToVec(quat: Quaternion) {
        const ret = new EntVector4(quat.x, quat.y, quat.z, quat.w);
        return ret;
    }

    static DirectionToQuaternion(dir: EntVector3): EntVector4 {
        const referenceDirection = new EntVector3(0, 0, 1);
        const normalizedNormal = EntVector3.Normalize(dir);

        const dotProduct = EntVector3.Dot(referenceDirection, normalizedNormal);
        const isNearlyParallel = Math.abs(1 - Math.abs(dotProduct)) < 1e-6;
        if (isNearlyParallel) {
            // Return identity quaternion if the input vectors are nearly parallel
            return new EntVector4(0, 0, 0, 1);
        }

        // Calculate the axis of rotation by taking the cross product of the reference direction and the target normal
        const rotationAxis = EntVector3.Normalize(EntVector3.Cross(referenceDirection, normalizedNormal));

        // Calculate the angle between the reference direction and the target normal
        const angle = Math.acos(Clamp(EntVector3.Dot(referenceDirection, normalizedNormal), -1, 1));

        // Create a quaternion from the axis and angle
        const quaternion = EntVector4.RotationAxis(rotationAxis, angle);

        return quaternion;
    }

    public static RotationAxis(axis: EntVector3, angle: number): EntVector4 {
        return EntVector4.RotationAxisToRef(axis, angle);
    }

    static RotationAxisToRef(axis: EntVector3, angle: number): EntVector4 {
        const sin = Math.sin(angle / 2);
        EntVector3.Normalize(axis);
        const result = new EntVector4();
        result.W = Math.cos(angle / 2);
        result.X = axis.X * sin;
        result.Y = axis.Y * sin;
        result.Z = axis.Z * sin;
        return result;
    }

    static EulerToQuaternion(vec: Vector3) {
        const result = new EntVector4();
        const halfRoll = vec.z * 0.5;
        const halfPitch = vec.x * 0.5;
        const halfYaw = vec.y * 0.5;

        const sinRoll = Math.sin(halfRoll);
        const cosRoll = Math.cos(halfRoll);
        const sinPitch = Math.sin(halfPitch);
        const cosPitch = Math.cos(halfPitch);
        const sinYaw = Math.sin(halfYaw);
        const cosYaw = Math.cos(halfYaw);

        result.X = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
        result.Y = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        result.Z = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        result.W = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

        return result;
    }

    static QuaternionToEuler(q: EntVector4): EntVector3 {
        const qz = q.Z;
        const qx = q.X;
        const qy = q.Y;
        const qw = q.W;

        const zAxisY = qy * qz - qx * qw;
        const limit = 0.4999999;

        var result = new EntVector3();

        if (zAxisY < -limit) {
            result.Y = 2 * Math.atan2(qy, qw);
            result.X = Math.PI / 2;
            result.Z = 0;
        } else if (zAxisY > limit) {
            result.Y = 2 * Math.atan2(qy, qw);
            result.X = -Math.PI / 2;
            result.Z = 0;
        } else {
            const sqw = qw * qw;
            const sqz = qz * qz;
            const sqx = qx * qx;
            const sqy = qy * qy;
            result.Z = Math.atan2(2.0 * (qx * qy + qz * qw), -sqz - sqx + sqy + sqw);
            result.X = Math.asin(-2.0 * zAxisY);
            result.Y = Math.atan2(2.0 * (qz * qx + qy * qw), sqz - sqx - sqy + sqw);
        }

        return result;
    }

    static Length(vec: EntVector4): number {
        return Math.sqrt(vec.X * vec.X + vec.Y * vec.Y + vec.Z * vec.Z + vec.W * vec.W);
    }

    static Inverse(vec: EntVector4): EntVector4 {
        let len = EntVector4.Length(vec);
        if (len === 0) {
            // handle invalid case
            throw new Error("Cannot calculate inverse, norm is 0");
        }
        let normSq = len * len;
        return new EntVector4(-vec.X / normSq, -vec.Y / normSq, -vec.Z / normSq, vec.W / normSq);
    }

    static MultiplyVector(v: EntVector3, quat: EntVector4): EntVector3 {
        // Convert the vector into a pure quaternion
        let u = new EntVector4(v.X, v.Y, v.Z, 0);

        // Perform the quaternion rotation
        let qConj = EntVector4.Inverse(quat);
        let p = EntVector4.Multiply(EntVector4.Multiply(quat, u), qConj);

        // Convert the resulting quaternion back into a vector
        return {
            X: p.X,
            Y: p.Y,
            Z: p.Z,
        };
    }

    static Conjugate(q: EntVector4): EntVector4 {
        const ret = new EntVector4(-q.X, -q.Y, -q.Z, q.W);
        return ret;
    }

    static Multiply(a: EntVector4, b: EntVector4): EntVector4 {
        const ret = new EntVector4();
        ret.X = a.W * b.X + a.X * b.W + a.Y * b.Z - a.Z * b.Y;
        ret.Y = a.W * b.Y - a.X * b.Z + a.Y * b.W + a.Z * b.X;
        ret.Z = a.W * b.Z + a.X * b.Y - a.Y * b.X + a.Z * b.W;
        ret.W = a.W * b.W - a.X * b.X - a.Y * b.Y - a.Z * b.Z;
        return ret;
    }
}

@RegisteredType(EntTransform)
export class EntTransform extends Component {
    @Saved(EntVector3)
    Position = new EntVector3();
    @Saved(EntVector4)
    Rotation = new EntVector4(0,0,0,1);
    @Saved(EntVector3)
    Scale = new EntVector3(1,1,1);
    
    static getAsInstanceArray(val: EntTransform): number[] {
        var ret: number[] = [];
        var Quat = new Quaternion(val.Rotation.X, val.Rotation.Y, val.Rotation.Z, val.Rotation.W);
        const mat = Matrix.Compose(
            new Vector3(val.Scale.X, val.Scale.Y, val.Scale.Z),
            Quat,
            new Vector3(val.Position.X, val.Position.Y, val.Position.Z)
        );
        mat.asArray().forEach(v => {
            ret.push(v);
        });
        return ret;
    }

    static clone(tf: EntTransform) {
        const ret = new EntTransform();
        ret.Position = EntVector3.clone(tf.Position);
        ret.Rotation = EntVector4.clone(tf.Rotation);
        ret.Scale = EntVector3.clone(tf.Scale);
        return ret;
    }

    static Equals(valA: EntTransform, valB: EntTransform) {
        return (
            EntVector3.Equals(valA.Position, valB.Position) &&
            EntVector4.Equals(valA.Rotation, valB.Rotation) &&
            EntVector3.Equals(valA.Scale, valB.Scale)
        );
    }

    static MeshToTransform(mesh: AbstractMesh) {
        const tf = new EntTransform();
        tf.Position = EntVector3.VectorToEnt(mesh.position);
        //TODO: Check htis
        tf.Rotation = EntVector4.EulerToQuaternion(mesh.rotation);
        tf.Scale = EntVector3.VectorToEnt(mesh.scaling);
        return tf;
    }

    static SetTransformForMesh(mesh: AbstractMesh, transform: EntTransform) {
        mesh.position = EntVector3.GetVector3(transform.Position);
        mesh.rotation = EntVector3.GetVector3(EntVector4.QuaternionToEuler(transform.Rotation));
        mesh.scaling = EntVector3.GetVector3(transform.Scale);
    }

    Copy(other:EntTransform) {
        this.Position = EntVector3.clone(other.Position);
        this.Rotation = EntVector4.clone(other.Rotation);
        this.Scale = EntVector3.clone(other.Scale);
    }
}
