#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <string>
class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
struct PhysicsCollider : public Component {
    CPROPERTY(NET, SAVE)
    std::string AwsPath;
    CPROPERTY(NET, SAVE)
    std::string MeshName;

    void onComponentRemoved(EntityData* entData) {
    }

    DECLARE_COMPONENT_METHODS(PhysicsCollider)
};