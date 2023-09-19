#pragma once
#include "Engine/Entities/EntitySystem.h"

// Manages building controls for the player
struct PlayerBuildingComponent : public Component {
    CPROPERTY(EntityData*, CurrentBuildItem, NO_DEFAULT, NET, SAVE)

    DECLARE_COMPONENT_METHODS(PlayerBuildingComponent)
};