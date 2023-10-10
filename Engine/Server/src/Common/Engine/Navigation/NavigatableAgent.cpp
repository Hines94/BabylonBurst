#include "NavigatableAgent.h"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "LoadedNavmeshData.h"
#include "recastnavigation/DetourCrowd.h"

void NavigatableAgent::onComponentAdded(EntityData* entData) {
    SetupNavmeshAgent(entData);
}

void NavigatableAgent::SetupNavmeshAgent(EntityData* ourEnt) {
    const auto navmeshData = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmeshData) {
        return;
    }

    const auto ourPos = EntityComponentSystem::GetComponent<EntTransform>(ourEnt);
    dtCrowdAgentParams ap;
    ap.radius = radius;
    ap.height = height;
    ap.maxAcceleration = maxAcceleration;
    ap.maxSpeed = maxSpeed;
    ap.collisionQueryRange = ap.radius * 12.0f;
    ap.pathOptimizationRange = ap.radius * 30.0f;
    ap.updateFlags = DT_CROWD_ANTICIPATE_TURNS | DT_CROWD_OPTIMIZE_VIS | DT_CROWD_SEPARATION;
    ap.obstacleAvoidanceType = 3; // Use 3rd type of built-in obstacle avoidance
    ap.separationWeight = 2.0f;

    if (crowdAgentId == 0) {
        const float floatPos[3] = {ourPos->Position.X, ourPos->Position.Y, ourPos->Position.Z};
        crowdAgentId = navmeshData->loadedCrowd.addAgent(floatPos, &ap);
    } else {
        navmeshData->loadedCrowd.updateAgentParameters(crowdAgentId, &ap);
    }
}

//Update every tick setting our transform pos to agent position
void NavigatableAgent::UpdateNavAgents(bool Init, double dt) {
    //TODO: Static tag to avoid updating non movers
    const auto navmeshData = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmeshData) {
        return;
    }
    //TODO: Rotation!
    const auto allNavAgents = EntityComponentSystem::GetEntitiesWithData({typeid(EntTransform), typeid(NavigatableAgent)}, {});
    EntityTaskRunners::AutoPerformTasksParallel(
        "UpdateNavAgents", allNavAgents, [navmeshData](double dt, EntityData* ent) -> void {
            const auto agentComp = EntityComponentSystem::GetComponent<NavigatableAgent>(ent);
            const auto transform = EntityComponentSystem::GetComponent<EntTransform>(ent);
            const auto agent = navmeshData->loadedCrowd.getAgent(agentComp->crowdAgentId);
            transform->Position.X = agent->npos[0];
            transform->Position.Y = agent->npos[1];
            transform->Position.Z = agent->npos[2];
        },
        0);
}

void NavigatableAgent::RequestMoveToTarget(EntVector3 target) {
    const auto navmeshData = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmeshData) {
        return;
    }
    const auto nearestPoly = navmeshData->FindNearestPoly(target);
    if (!nearestPoly) {
        std::cerr << "Requested to move to a non valid area" << std::endl;
        return;
    }
    const float pos[3] = {target.X, target.Y, target.Z};
    if (!navmeshData->loadedCrowd.requestMoveTarget(crowdAgentId, nearestPoly.value(), pos)) {
        std::cerr << "Move request failed for agent: " << crowdAgentId << std::endl;
    }
}

void NavigatableAgent::onComponentRemoved(EntityData* entData) {
    //Remove agent from our navmesh
    const auto navmeshData = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmeshData) {
        return;
    }
    navmeshData->loadedCrowd.removeAgent(crowdAgentId);
}