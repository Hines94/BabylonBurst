#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include <string>
class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
struct PhysicsCollider : public Component {
    CPROPERTY(ModelSpecifier, ColliderMesh, NO_DEFAULT, NET, SAVE)

    DECLARE_COMPONENT_METHODS(PhysicsCollider)
};