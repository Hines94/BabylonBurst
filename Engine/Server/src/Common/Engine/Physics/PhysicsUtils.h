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
}