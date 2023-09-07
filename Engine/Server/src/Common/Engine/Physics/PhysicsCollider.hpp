#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include <string>
class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
struct PhysicsCollider : public Component {
    CPROPERTY(NET, SAVE)
    ModelSpecifier ColliderMesh;

    DECLARE_COMPONENT_METHODS(PhysicsCollider)
};