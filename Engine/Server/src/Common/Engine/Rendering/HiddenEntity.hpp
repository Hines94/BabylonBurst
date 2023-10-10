#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <string>

//Allows us to hide an entity with an easy tag
struct HiddenEntity : public Component {

    DECLARE_COMPONENT_METHODS(HiddenEntity)
};