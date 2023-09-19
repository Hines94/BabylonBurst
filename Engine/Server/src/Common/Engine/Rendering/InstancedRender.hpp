#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/MaterialSpecifier.hpp"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include <string>

class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
//Render a static mesh in world view by adding this
struct InstancedRender : public Component {

    //Model to render - will be influenced by pos/scaling/rotation from EntTransform
    CPROPERTY(ModelSpecifier, ModelData, NO_DEFAULT, NET, SAVE)

    //Materials to render for our model
    CPROPERTY(std::vector<MaterialSpecifier>, MaterialData, NO_DEFAULT, NET, SAVE)

    //Layermask to use - can set custom laermasks for rendering
    CPROPERTY(uint, LayerMask, NO_DEFAULT, NET, SAVE)

    DECLARE_COMPONENT_METHODS(InstancedRender)
};