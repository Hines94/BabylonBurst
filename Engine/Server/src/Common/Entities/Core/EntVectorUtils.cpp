#include "EntVectorUtils.h"
#include <cmath>

EntVector4 EntVectorUtils::EulerToQuaternion(const EntVector3& vec) {
    auto result = EntVector4();
    auto halfRoll = vec.Z * 0.5;
    auto halfPitch = vec.X * 0.5;
    auto halfYaw = vec.Y * 0.5;

    auto sinRoll = std::sin(halfRoll);
    auto cosRoll = std::cos(halfRoll);
    auto sinPitch = std::sin(halfPitch);
    auto cosPitch = std::cos(halfPitch);
    auto sinYaw = std::sin(halfYaw);
    auto cosYaw = std::cos(halfYaw);

    result.X = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
    result.Y = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    result.Z = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    result.W = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

    return result;
}

EntVector4 EntVectorUtils::Multiply(const EntVector4& a, const EntVector4& b) {
    auto ret = EntVector4();
    ret.X = a.W * b.X + a.X * b.W + a.Y * b.Z - a.Z * b.Y;
    ret.Y = a.W * b.Y - a.X * b.Z + a.Y * b.W + a.Z * b.X;
    ret.Z = a.W * b.Z + a.X * b.Y - a.Y * b.X + a.Z * b.W;
    ret.W = a.W * b.W - a.X * b.X - a.Y * b.Y - a.Z * b.Z;
    return ret;
}

EntVector3 EntVectorUtils::Multiply(const EntVector3& a, const EntVector3& b) {
    return EntVector3(
        a.X * b.X,
        a.Y * b.Y,
        a.Z * b.Z);
}

EntVector3 EntVectorUtils::MultiplyFloat(const EntVector3& v, float val) {
    return EntVector3(
        v.X * val,
        v.Y * val,
        v.Z * val);
}

float EntVectorUtils::Length(const EntVector3& vector) {
    return std::sqrt(vector.X * vector.X + vector.Y * vector.Y + vector.Z * vector.Z);
}

float EntVectorUtils::Dot(const EntVector3& a, const EntVector3& b) {
    return a.X * b.X + a.Y * b.Y + a.Z * b.Z;
}

std::vector<std::vector<float>> EntVectorUtils::QuaternionToMatrix(const EntVector4& quaternion) {
    float xx = quaternion.X * quaternion.X;
    float yy = quaternion.Y * quaternion.Y;
    float zz = quaternion.Z * quaternion.Z;
    float xy = quaternion.X * quaternion.Y;
    float xz = quaternion.X * quaternion.Z;
    float yz = quaternion.Y * quaternion.Z;
    float wx = quaternion.W * quaternion.X;
    float wy = quaternion.W * quaternion.Y;
    float wz = quaternion.W * quaternion.Z;

    return {{{{1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)}},
             {{2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)}},
             {{2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)}}}};
}

EntVector3 EntVectorUtils::GetNormalizedAxis(DirectionAxis axisType, const EntVector4& Rot) {
    auto mat = QuaternionToMatrix(Rot);

    switch (axisType) {
    case ForwardAxis:
        return EntVector3{mat[0][2], mat[1][2], mat[2][2]}.Normalize();
    case BackwardAxis:
        return EntVector3{-mat[0][2], -mat[1][2], -mat[2][2]}.Normalize();
    case LeftAxis:
        return EntVector3{mat[0][0], mat[1][0], mat[2][0]}.Normalize();
    case RightAxis:
        return EntVector3{-mat[0][0], -mat[1][0], -mat[2][0]}.Normalize();
    case UpAxis:
        return EntVector3{mat[0][1], mat[1][1], mat[2][1]}.Normalize();
    case DownAxis:
        return EntVector3{-mat[0][1], -mat[1][1], -mat[2][1]}.Normalize();
    default:
        return EntVector3{};
    }
}