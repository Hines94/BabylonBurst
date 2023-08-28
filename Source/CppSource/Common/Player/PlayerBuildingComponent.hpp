#pragma once
#include "Engine/Entities/EntitySystem.h"

//Manages building controls for the player
struct PlayerBuildingComponent : public Component {
    CPROPERTY(NET, SAVE)
    EntityData* CurrentBuildItem;

    DECLARE_COMPONENT_METHODS(PlayerBuildingComponent)
};