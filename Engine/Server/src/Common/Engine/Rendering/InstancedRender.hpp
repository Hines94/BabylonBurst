#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include <string>

class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
//Render a static mesh in world view by adding this
struct InstancedRender : public Component {

    CPROPERTY(NET, SAVE)
    //Model to render - will be influenced by pos/scaling/rotation from EntTransform
    ModelSpecifier ModelData;

    CPROPERTY(NET, SAVE)
    //Layermask to use - can set custom laermasks for rendering
    uint LayerMask;

    DECLARE_COMPONENT_METHODS(InstancedRender)
};