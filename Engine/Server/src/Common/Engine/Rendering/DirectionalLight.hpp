#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include <string>

//A directional light
struct DirectionalLight : public Component {
    CPROPERTY(NET, SAVE)
    EntVector3 Position;
    CPROPERTY(NET, SAVE)
    EntVector3 Direction;

    DECLARE_COMPONENT_METHODS(DirectionalLight)
};