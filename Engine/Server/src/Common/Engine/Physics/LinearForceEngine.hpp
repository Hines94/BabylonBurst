#pragma once
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/Core/EntVectorUtils.h"
#include "Engine/Entities/EntitySystem.h"
#include "RigidBody.h"

//Specifier for an axis that our engine can apply force through (relative )
struct LinearForceEngineAxis {
    //Eg - forward, backwards etc
    DirectionAxis RelativeAxis;
    float ForceAmmt;
};

//Applies liner forces to one or several rigidbodies per frame
struct LinearForceEngine : public Component {
    CPROPERTY(bool, Enabled, true, NET, SAVE)
    float DampingPowerMulti = 2;
    std::vector<float> Throttles;
    std::vector<LinearForceEngineAxis> ForceAppliers;

    DECLARE_COMPONENT_METHODS(LinearForceEngine)

    //Apply linear force using simple requests (forward/back etc)
    void ApplyLinearForceToBody(EntityData* body, EntityData* Us, float RequestedForward, float RequestedSide, float RequestedUp) {
        auto transform = EntityComponentSystem::GetComponent<EntTransform>(body);
        auto rigidBody = EntityComponentSystem::GetComponent<RigidBody>(body);
        auto bodyRot = transform->Rotation;
        auto bodyVeloc = rigidBody->Velocity;
        auto bodyVelocLength = EntVectorUtils::Length(bodyVeloc);
        auto ourTransform = EntityComponentSystem::GetComponent<EntTransform>(Us);
        auto ourRot = ourTransform->Rotation;

        const float absForward = std::abs(RequestedForward);
        const float absUp = std::abs(RequestedUp);
        const float absSide = std::abs(RequestedSide);

        const float fwdDampProp = 1.f - absForward;
        const float sideDampProp = 1.f - absSide;
        const float upDampProp = 1.f - absUp;

        auto normalizedForward = EntVectorUtils::GetNormalizedAxis(ForwardAxis, bodyRot);
        auto forwardAxisRequest = EntVectorUtils::MultiplyFloat(normalizedForward, RequestedForward).Normalize();

        auto normalizedSide = EntVectorUtils::GetNormalizedAxis(LeftAxis, bodyRot); //We think of side as -1 left 1 right, but this needs to be flipped
        auto sideAxisRequest = EntVectorUtils::MultiplyFloat(normalizedSide, -RequestedSide).Normalize();

        auto normalizedUp = EntVectorUtils::GetNormalizedAxis(UpAxis, bodyRot);
        auto upAxisRequest = EntVectorUtils::MultiplyFloat(normalizedUp, RequestedUp).Normalize();

        for (auto& axis : ForceAppliers) {
            auto axisNormal = EntVectorUtils::GetNormalizedAxis(axis.RelativeAxis, ourRot);
            //Forward
            ApplyForceOnAxis(axisNormal, axis.ForceAmmt, rigidBody, bodyVelocLength, bodyVeloc, forwardAxisRequest, normalizedForward, absForward, fwdDampProp);
            //Side
            ApplyForceOnAxis(axisNormal, axis.ForceAmmt, rigidBody, bodyVelocLength, bodyVeloc, sideAxisRequest, normalizedSide, absSide, sideDampProp);
            //Up
            ApplyForceOnAxis(axisNormal, axis.ForceAmmt, rigidBody, bodyVelocLength, bodyVeloc, upAxisRequest, normalizedUp, absUp, upDampProp);
        }
    }

private:
    void ApplyForceOnAxis(const EntVector3& engineAxisNormal, const float& engineForce, RigidBody* rigidBody, const float& bodyVelocLength, const EntVector3& bodyVeloc,
                          const EntVector3& moveRequest, const EntVector3& movementAxisNormal, const float& absRequest, const float& dampProportion) {
        auto engineToRequest = EntVectorUtils::Dot(engineAxisNormal, moveRequest);
        //Perform any requested movement
        if (absRequest > 0.01 && engineToRequest > 0.05) {
            auto applyForce = engineForce * engineToRequest * absRequest;
            auto finalForce = EntVectorUtils::MultiplyFloat(engineAxisNormal, applyForce);
            rigidBody->AddCentralForce(finalForce);
        }
        //Take fwdDampProp off of velocity
        if (bodyVelocLength > 0.01 && dampProportion > 0) {
            //TODO: Get proportion of power that aligns with this movement normal
            auto engVeloc = EntVectorUtils::Multiply(bodyVeloc, engineAxisNormal);
            auto dampDot = EntVectorUtils::Dot(bodyVeloc, engineAxisNormal);
            auto dampSlowingMulti = std::clamp(EntVectorUtils::Length(engVeloc) / 0.1f, 0.f, 1.f);
            if (dampDot < 0) {
                //Proportion of engine power dedicated to this axis
                auto engAxis = EntVectorUtils::Dot(engineAxisNormal, movementAxisNormal);
                auto dampAmmt = engineForce * dampProportion * std::abs(dampDot) * std::abs(engAxis) * dampSlowingMulti * DampingPowerMulti;
                auto finalDamp = EntVectorUtils::MultiplyFloat(engineAxisNormal, dampAmmt);
                rigidBody->AddCentralForce(finalDamp, false);
            }
        }
    }
};