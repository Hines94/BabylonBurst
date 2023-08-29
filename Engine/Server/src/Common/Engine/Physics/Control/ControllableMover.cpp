#include "ControllableMover.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Physics/LinearForceEngine.hpp"

void ControllableMover::UpdateMovementControllers(bool firstTime, double deltaTime) {
    auto rotatorControls = EntityComponentSystem::GetEntitiesWithData({typeid(ControllableMover)}, {});
    EntityTaskRunners::AutoPerformTasksParallel("MoveControllers", rotatorControls, UpdateMovementController, deltaTime);
}

void ControllableMover::UpdateMovementController(double deltaTime, EntityData* controller) {
    //Get Required Vals
    auto contMov = EntityComponentSystem::GetComponent<ControllableMover>(controller);
    auto clampedForward = std::clamp(contMov->RequestedForwardAxis, -1.f, 1.f);
    auto clampedSide = std::clamp(-contMov->RequestedSideAxis, -1.f, 1.f);
    auto clampedUp = std::clamp(contMov->RequestedUpAxis, -1.f, 1.f);

    for (auto& re : contMov->ControllableForceAppliers) {
        if (EntityComponentSystem::IsValid(re) == false) {
            continue;
        }
        if (EntityComponentSystem::HasComponent<LinearForceEngine>(re) == false) {
            continue;
        }
        auto eng = EntityComponentSystem::GetComponent<LinearForceEngine>(re);
        eng->ApplyLinearForceToBody(controller, re, clampedForward, clampedSide, clampedUp);
    }
    //Clear inputs back to zero
    contMov->RequestedForwardAxis = 0;
    contMov->RequestedSideAxis = 0;
    contMov->RequestedUpAxis = 0;
}