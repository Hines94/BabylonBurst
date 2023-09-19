#pragma once
#include "Engine/Entities/EntitySystem.h"

//Part of the controllable entity - responsible for controling our linear movement - forward, backward, inert damp etc
struct ControllableMover : public Component {
    float RequestedForwardAxis;
    float RequestedSideAxis;
    float RequestedUpAxis;

    bool InertialDamping;

    CPROPERTY(std::vector<EntityData*>, ControllableForceAppliers, NO_DEFAULT, NET, SAVE)

    static void UpdateMovementControllers(bool SystemInit, double deltaTime);

    DECLARE_COMPONENT_METHODS(ControllableMover)

private:
    static void UpdateMovementController(double deltaTime, EntityData* controller);
};