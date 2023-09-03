#pragma once
#include "Engine/Entities/EntitySystem.h"

//Part of the controllable entity - responsible for controling our linear movement - forward, backward, inert damp etc
struct ControllableMover : public Component {
    float RequestedForwardAxis;
    float RequestedSideAxis;
    float RequestedUpAxis;

    bool InertialDamping;

    CPROPERTY(NET, SAVE)
    std::vector<EntityData*> ControllableForceAppliers;

    static void UpdateMovementControllers(bool firstTime, double deltaTime);

    DECLARE_COMPONENT_METHODS(ControllableMover)

private:
    static void UpdateMovementController(double deltaTime, EntityData* controller);
};