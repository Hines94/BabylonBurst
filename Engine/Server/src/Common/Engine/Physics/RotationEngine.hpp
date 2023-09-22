#pragma once
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/Core/EntVectorUtils.h"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Utils/MathUtils.h"
#include "RigidBody.h"

//A rotation "engine" that can be used to rotate an object about using physics
struct RotationEngine : public Component {
    CPROPERTY(bool, Enabled, true, NET, SAVE)
    //TODO: Replace this with axis - eg pitch up/down
    CPROPERTY(float, RotationPower, 100, NET, SAVE)
    CPROPERTY(float, StabilityMultiplier, 3, NET, SAVE)

    DECLARE_COMPONENT_METHODS(RotationEngine)

    //Take a normalized movement request (yaw pitch -1 to 1) and process it into the item
    void processNormalizedMovementRequest(EntityData* mover, float clampedYaw, float clampedPitch, float clampedRoll, double deltaTime) {
        if (!Enabled) {
            return;
        }

        //Rotate using rigidbody
        if (EntityComponentSystem::HasComponent<RigidBody>(mover) == false) {
            return;
        }
        auto rb = EntityComponentSystem::GetComponent<RigidBody>(mover);
        if (!rb->ItemRigidBody) {
            return;
        }
        rb->AddLocalTorque(
            clampedYaw * RotationPower,
            clampedPitch * RotationPower,
            clampedRoll * RotationPower);

        //TODO: Move these calcs to the controller level to avoid "ping-pong" when multiple rotators overcook it past zero
        const float yawDampProp = 1.f - std::abs(clampedYaw);
        const float pitchDampProp = 1.f - std::abs(clampedPitch);
        const float rollDampProp = 1.f - std::abs(clampedRoll);
        // Get the current angular velocity in global coordinates
        btVector3 angularVelocityGlobal = rb->ItemRigidBody->getAngularVelocity();

        // Transform this to local coordinates
        btMatrix3x3 rotMatrix = rb->ItemRigidBody->getWorldTransform().getBasis();
        btVector3 angularVelocityLocal = rotMatrix.inverse() * angularVelocityGlobal;

        // Compute the damping torque
        btVector3 dampingTorqueLocal(0, 0, 0);

        //TODO: take local out of x for example angveloc.x/2 and clamp to make sim more stable for powerful rotators?
        dampingTorqueLocal.setX(-angularVelocityLocal.x() * RotationPower * pitchDampProp * StabilityMultiplier);
        dampingTorqueLocal.setY(-angularVelocityLocal.y() * RotationPower * yawDampProp * StabilityMultiplier);
        dampingTorqueLocal.setZ(-angularVelocityLocal.z() * RotationPower * rollDampProp * StabilityMultiplier);

        // Convert this back to global coordinates
        btVector3 dampingTorqueGlobal = rotMatrix * dampingTorqueLocal;

        // Apply the damping torque
        rb->ItemRigidBody->applyTorque(dampingTorqueGlobal);
    }

private:
    float calculatePitchValue(double desPitch, double dt) {
        auto clamped = std::clamp(desPitch, -1.0, 1.0);
        return clamped * dt * RotationPower;
    }
    float calculateYawValue(double desYaw, double dt) {
        auto clamped = std::clamp(desYaw, -1.0, 1.0);
        return clamped * dt * RotationPower;
    }
    float calculateRollValue(double desRoll, double dt) {
        auto clamped = std::clamp(desRoll, -1.0, 1.0);
        return clamped * dt * RotationPower;
    }
};