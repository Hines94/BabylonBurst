#pragma once
#include "Engine/Entities/EntitySystem.h"

//A player pawn that can be moved around on a navmesh
struct PlayerPawn : public Component {
    DECLARE_COMPONENT_METHODS(PlayerPawn)

    CPROPERTY(EntityData*, SpawnedEntity, NO_DEFAULT, NET,SAVE)

    void SetupNewPawn(EntityData* pawn);
};
