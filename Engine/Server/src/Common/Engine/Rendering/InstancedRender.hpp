#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <string>

class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
struct InstancedRender : public Component {
    CPROPERTY(NET, SAVE)
    std::string AwsPath;
    CPROPERTY(NET, SAVE)
    std::string MeshName;
    uint LayerMask;

    void onComponentRemoved(EntityData* entData) {
    }

    DECLARE_COMPONENT_METHODS(InstancedRender)
};