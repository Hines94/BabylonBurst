#pragma once
#include "EntTransform.hpp"
#include "EntVector3.hpp"
#include "EntVector4.hpp"
#include <vector>

namespace EntVectorUtils {
    EntVector4 EulerToQuaternion(const EntVector3& vec);

    EntVector4 Multiply(const EntVector4& a, const EntVector4& b);

    EntVector3 Multiply(const EntVector3& a, const EntVector3& b);

    EntVector3 MultiplyFloat(const EntVector3& v, float val);

    float Length(const EntVector3& v);

    float Dot(const EntVector3& a, const EntVector3& b);

    EntVector3 GetNormalizedAxis(DirectionAxis axis, const EntVector4& Rot);

    std::vector<std::vector<float>> QuaternionToMatrix(const EntVector4& quaternion);
} // namespace EntVectorUtils