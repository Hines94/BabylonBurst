#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <string>

//An object that can be hit with a raycast
struct RaycastableObject : public Component {

    DECLARE_COMPONENT_METHODS(RaycastableObject)
};