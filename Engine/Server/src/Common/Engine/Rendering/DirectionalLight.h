#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include <string>

//A directional light
struct DirectionalLight : public Component {
    CPROPERTY(EntVector3, Position, NO_DEFAULT, NET, SAVE)

    CPROPERTY(EntVector3, Direction, NO_DEFAULT, NET, SAVE)

    void onComponentAdded(EntityData* entData) override;

    void onComponentChanged(EntityData* entData) override;

    DECLARE_COMPONENT_METHODS(DirectionalLight)
};