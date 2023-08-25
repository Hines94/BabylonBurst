#include "ControllableRotator.h"
#include "Entities/EntityTaskRunners.hpp"
#include "Physics/RotationEngine.hpp"

void ControllableRotator::UpdateRotationControllers(bool firstTime, double deltaTime) {
    auto rotatorControls = EntityComponentSystem::GetEntitiesWithData({typeid(ControllableRotator)}, {});
    EntityTaskRunners::AutoPerformTasksParallel("RotControllers", rotatorControls, UpdateRotationController, deltaTime);
}

void ControllableRotator::UpdateRotationController(double deltaTime, EntityData* controller) {
    //Process inputs
    auto contRot = EntityComponentSystem::GetComponent<ControllableRotator>(controller);
    auto clampedYaw = std::clamp(contRot->RequestedYaw, -1.f, 1.f);
    auto clampedPitch = std::clamp(contRot->RequestedPitch, -1.f, 1.f);
    auto clampedRoll = std::clamp(contRot->RequestedRoll, -1.f, 1.f);
    for (auto& re : contRot->ControllableRotators) {
        if (EntityComponentSystem::IsValid(re) == false) {
            continue;
        }
        if (EntityComponentSystem::HasComponent<RotationEngine>(re) == false) {
            continue;
        }
        auto eng = EntityComponentSystem::GetComponent<RotationEngine>(re);
        eng->processNormalizedMovementRequest(controller, clampedYaw, clampedPitch, clampedRoll, deltaTime);
    }
    //Clear inputs back to zero
    contRot->RequestedPitch = 0;
    contRot->RequestedRoll = 0;
    contRot->RequestedYaw = 0;
}