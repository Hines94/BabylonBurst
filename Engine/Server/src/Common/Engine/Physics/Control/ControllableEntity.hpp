#pragma once
#include "Engine/Entities/EntitySystem.h"

//Eg a pawn or ship - something that can be taken control of by a character or AI
struct ControllableEntity : public Component {

    //The controller that controls this controllable entity
    CPROPERTY(NET, SAVE)
    EntityData* CurrentController;

    //All Linear engines under the control of this Entity

    //All Rotators under the control of this Entity

    DECLARE_COMPONENT_METHODS(ControllableEntity)
};