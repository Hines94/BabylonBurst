#pragma once
#include "Entities/Control/ControllableMover.h"
#include "Entities/Control/ControllableRotator.h"
#include "Entities/EntitySystem.h"
#include "Entities/EntityTaskRunners.hpp"
#include "PlayerPawn.hpp"
#include <nlohmann/json.hpp>
#include <string>

//Requested movement instructions
struct PlayerRequestingMessage {
    float RequestForwardAxis;
    float RequestSideAxis;
    float RequestUpAxis;
    float RequestYawLook;
    float RequestPitchLook;
    float RequestRollLook;
};

//Our player controller - deals with requesting movement to controlled entity and tracking what
struct PlayerController : public Component {
    CPROPERTY(NET, SAVE)
    std::string Playeruuid;
    CPROPERTY(NET, SAVE)
    EntityData* ControlledPawn;
    CPROPERTY(NET, SAVE)
    EntityData* CurrentControllingEntity;
    CPROPERTY(NOTYPINGS)
    PlayerRequestingMessage playerRequests;

    DECLARE_COMPONENT_METHODS(PlayerController)

    //Inherited methods
    void onComponentRemoved(EntityData* entData) {
        if (CurrentControllingEntity != nullptr && IsControllingPawn() == false) {
            auto Cont = EntityComponentSystem::GetComponent<ControllableEntity>(CurrentControllingEntity);
            std::unique_lock lock(writeMutex);
            Cont->CurrentController = nullptr;
        }
    }

    //Methods
    bool IsControllingPawn() {
        return ControlledPawn != nullptr && CurrentControllingEntity != nullptr && CurrentControllingEntity == ControlledPawn;
    }

    bool ChangeControlledTarget(EntityData* newTarget, EntityData* playerEnt) {
        //Check this item can be controlled
        auto newControllable = EntityComponentSystem::GetComponent<ControllableEntity>(newTarget);
        {
            std::shared_lock readLock(newControllable->writeMutex);
            if (newControllable != nullptr && newControllable->CurrentController != nullptr) {
                //Item is already controlled!
                return false;
            }
        }

        //Remove old target
        if (CurrentControllingEntity != nullptr) {
            auto oldComp = EntityComponentSystem::GetComponent<ControllableEntity>(CurrentControllingEntity);
            std::unique_lock oldC(oldComp->writeMutex);
            oldComp->CurrentController = nullptr;
        }

        //Set new target
        std::unique_lock ourLock(writeMutex);
        if (EntityComponentSystem::HasComponent<ControllableEntity>(newTarget) == false) {
            return false;
        }
        auto otherComp = EntityComponentSystem::GetComponent<ControllableEntity>(newTarget);
        otherComp->writeMutex.lock();
        otherComp->CurrentController = playerEnt;
        otherComp->writeMutex.unlock();
        CurrentControllingEntity = newTarget;
        if (newControllable != nullptr) {
            std::unique_lock lock(newControllable->writeMutex);
            newControllable->CurrentController = playerEnt;
        }
        EntityComponentSystem::MarkCompToNetwork<PlayerController>(playerEnt);

        return true;
    }

    static void createNewPlayer(EntityData* playerData, std::string uuid) {
        auto pc = new PlayerController();
        pc->Playeruuid = uuid;
        EntityComponentSystem::AddSetComponentToEntity(playerData, pc);
        //Create and control pawn
        pc->SpawnPlayerPawn(playerData);
    }

    void SpawnPlayerPawn(EntityData* owner) {
        //Basic setup
        auto pawnEnt = EntityComponentSystem::AddEntity();
        std::unique_lock lock(writeMutex);
        ControlledPawn = pawnEnt;
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, new PlayerPawn());
        lock.unlock();
        PlayerPawn::SetupPlayerPawn(pawnEnt);
        ChangeControlledTarget(pawnEnt, owner);
    }

    static void UpdatePlayerControllers(bool init, double deltaTime) {
        //Iterate through all player controllers
        auto allPC = EntityComponentSystem::GetEntitiesWithData({typeid(PlayerController)}, {});
        EntityTaskRunners::AutoPerformTasksParallel("PlayerControlUpdate", allPC, updatePlayerControl, deltaTime);
    }

private:
    static void updatePlayerControl(double dt, EntityData* item) {
        auto playerComp = EntityComponentSystem::GetComponent<PlayerController>(item);
        //Control our CurrentControllingEntity
        if (!playerComp->CurrentControllingEntity) {
            return;
        }
        auto controlComp = EntityComponentSystem::GetComponent<ControllableEntity>(playerComp->CurrentControllingEntity);
        if (controlComp == nullptr) {
            return;
        }

        //Set values in our controlled component controllers
        if (EntityComponentSystem::HasComponent<ControllableRotator>(playerComp->CurrentControllingEntity)) {
            auto rotComp = EntityComponentSystem::GetComponent<ControllableRotator>(playerComp->CurrentControllingEntity);
            rotComp->RequestedPitch = playerComp->playerRequests.RequestPitchLook;
            rotComp->RequestedRoll = playerComp->playerRequests.RequestRollLook;
            rotComp->RequestedYaw = playerComp->playerRequests.RequestYawLook;
        }
        if (EntityComponentSystem::HasComponent<ControllableMover>(playerComp->CurrentControllingEntity)) {
            auto linComp = EntityComponentSystem::GetComponent<ControllableMover>(playerComp->CurrentControllingEntity);
            linComp->RequestedForwardAxis = playerComp->playerRequests.RequestForwardAxis;
            linComp->RequestedSideAxis = playerComp->playerRequests.RequestSideAxis;
            linComp->RequestedUpAxis = playerComp->playerRequests.RequestUpAxis;
        }

        //TODO: If no requests after a while from player simply revert back to nothing in case dc etc?
    }
};