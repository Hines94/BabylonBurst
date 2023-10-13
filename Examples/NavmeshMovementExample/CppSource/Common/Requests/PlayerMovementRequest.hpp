#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Utils/AutoSerializedMessage.h"

//Movement request for targeted entities to move to the desired location
struct PlayerMovementRequest : public AutoSerializedMessage {

    DECLARE_AUTO_SERIALIZE_METHODS();

    std::vector<EntityData*> targetedEnts;
    EntVector3 movementPos;
};