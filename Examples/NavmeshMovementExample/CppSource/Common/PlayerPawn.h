#pragma once
#include "Engine/Entities/EntitySystem.h"

//A player pawn that can be moved around on a navmesh
struct PlayerPawn : public Component {
    DECLARE_COMPONENT_METHODS(PlayerPawn)

    CPROPERTY(NET,SAVE)
    EntityData* SpawnedEntity;

    void SetupNewPawn(EntityData* pawn);
};
