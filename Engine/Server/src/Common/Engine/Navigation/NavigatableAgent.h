#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"

//A mesh that can be used to move about a Navigatable Pawn
REQUIRE_OTHER_COMPONENTS(EntTransform)
struct NavigatableAgent : public Component {

    //Radius of the agent in terms of footprint
    CPROPERTY(float, radius, 2, SAVE, NET)

    CPROPERTY(float, height, 2, SAVE, NET)

    CPROPERTY(float, maxAcceleration, 8, SAVE, NET)

    CPROPERTY(float, maxSpeed, 4, SAVE, NET)

    int crowdAgentId = 0;

    void RequestMoveToTarget(EntVector3 target);

    void SetupNavmeshAgent(EntityData* ourEnt);

    void onComponentRemoved(EntityData* entData) override;

    void onComponentAdded(EntityData* entData) override;

    static void UpdateNavAgents(bool Init, double dt);

    DECLARE_COMPONENT_METHODS(NavigatableAgent)
};