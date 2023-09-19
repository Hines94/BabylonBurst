#pragma once
#include "Engine/Entities/EntitySystem.h"

//Holds information on the player such as our spawned pawn
struct PlayerMainSpawner : public Component {
    DECLARE_COMPONENT_METHODS(PlayerMainSpawner)

    CPROPERTY(EntityData*, SpawnedEntity, NO_DEFAULT,NET,SAVE)

    void SetupNewPlayer(EntityData* player);
};
