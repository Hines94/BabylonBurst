#pragma once
#include "Entities/Control/ControllableEntity.hpp"
#include "Entities/Control/ControllableMover.h"
#include "Entities/Control/ControllableRotator.h"
#include "Entities/Core/EntTransform.h"
#include "Entities/EntitySystem.h"
#include "Networking/ClientLerpTransform.hpp"
#include "Physics/CapsuleCollider.hpp"
#include "Physics/LinearForceEngine.hpp"
#include "Physics/RigidBody.h"
#include "Physics/RotationEngine.hpp"
#include "Rendering/InstancedRender.hpp"

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