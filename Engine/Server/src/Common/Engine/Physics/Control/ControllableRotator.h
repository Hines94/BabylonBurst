#pragma once
#include "Engine/Entities/EntitySystem.h"

//Part of the controllable entity - responsible for controling our rotation, look towards etc
struct ControllableRotator : public Component {
    float RequestedPitch;
    float RequestedYaw;
    float RequestedRoll;

    CPROPERTY(NET, SAVE)
    std::vector<EntityData*> ControllableRotators;

    static void UpdateRotationControllers(bool firstTime, double deltaTime);

    DECLARE_COMPONENT_METHODS(ControllableRotator)

private:
    static void UpdateRotationController(double deltaTime, EntityData* controller);
};