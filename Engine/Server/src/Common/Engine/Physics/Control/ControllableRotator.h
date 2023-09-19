#pragma once
#include "Engine/Entities/EntitySystem.h"

//Part of the controllable entity - responsible for controling our rotation, look towards etc
struct ControllableRotator : public Component {
    float RequestedPitch;
    float RequestedYaw;
    float RequestedRoll;

    CPROPERTY(std::vector<EntityData*>, ControllableRotators, NO_DEFAULT, NET, SAVE)

    static void UpdateRotationControllers(bool SystemInit, double deltaTime);

    DECLARE_COMPONENT_METHODS(ControllableRotator)

private:
    static void UpdateRotationController(double deltaTime, EntityData* controller);
};