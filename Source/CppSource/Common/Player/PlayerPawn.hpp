#pragma once
#include "Engine/Physics/Control/ControllableEntity.hpp"
#include "Engine/Physics/Control/ControllableMover.h"
#include "Engine/Physics/Control/ControllableRotator.h"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Networking/ClientLerpTransform.hpp"
#include "Engine/Physics/CapsuleCollider.hpp"
#include "Engine/Physics/LinearForceEngine.hpp"
#include "Engine/Physics/RigidBody.h"
#include "Engine/Physics/RotationEngine.hpp"
#include "Engine/Rendering/InstancedRender.hpp"

// A pawn that can be controlled by our player
struct PlayerPawn : public Component {

    DECLARE_COMPONENT_METHODS(PlayerPawn)

    static void SetupPlayerPawn(EntityData* pawnEnt) {
        //Transform
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, new EntTransform());

        //Render
        auto tempRender = new InstancedRender();
        tempRender->AwsPath = "debug/TestHuman";
        tempRender->MeshName = "TestHuman";
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, tempRender);

        //Physics
        auto capsule = new CapsuleCollider();
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, capsule);
        auto rigidBody = new RigidBody();
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, rigidBody);
        auto rotator = new RotationEngine();
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, rotator);
        auto linearEng = new LinearForceEngine();
        //Add basic linear movement capability
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{ForwardAxis, 1000});
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{BackwardAxis, 1000});
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{RightAxis, 1000});
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{LeftAxis, 1000});
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{UpAxis, 1000});
        linearEng->ForceAppliers.push_back(LinearForceEngineAxis{DownAxis, 1000});
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, linearEng);

        //Controls
        auto contEnt = new ControllableEntity();
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, contEnt);
        auto rotControl = new ControllableRotator();
        rotControl->ControllableRotators.push_back(pawnEnt);
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, rotControl);
        auto movControl = new ControllableMover();
        movControl->ControllableForceAppliers.push_back(pawnEnt);
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, movControl);

        //Network smoothing
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, new ClientLerpTransform());
        // Entities.AddSetComponentToEntity(pawnEnt, &Core.OwnedComponent{
        //     OwningPlayer: playerCont.Playeruuid,
        // })
    }
};