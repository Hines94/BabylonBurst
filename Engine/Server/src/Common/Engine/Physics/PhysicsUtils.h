#pragma once
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Rendering/ExtractedMeshData.h"
#include <optional>

struct RaycastableMeshDetails {
    EntTransform* transform;
    ExtractedModelData* data;
};

namespace PhysicsUtils {
    std::optional<EntVector3> RaycastMeshes(std::vector<RaycastableMeshDetails> meshesIn, EntVector3 Origin, EntVector3 Direction, float Distance);
    //Returns hit pos if hit
    std::optional<EntVector3> RaycastSphere(EntVector3 sphereOrigin, float sphereRadius, EntVector3 RayOrigin, EntVector3 RayDirection, float Distance);
} // namespace PhysicsUtils