#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Physics/Control/ControllableMover.h"
#include "Engine/Physics/Control/ControllableRotator.h"
#include "Engine/Player/PlayerCoreComponent.hpp"
#include "PlayerPawn.hpp"

// Requested movement instructions
struct PlayerRequestingMessage {
    float RequestForwardAxis;
    float RequestSideAxis;
    float RequestUpAxis;
    float RequestYawLook;
    float RequestPitchLook;
    float RequestRollLook;
};

struct FlyingPlayerController : public Component {
    CPROPERTY(NET, SAVE)
    EntityData* ControlledPawn;
    CPROPERTY(NET, SAVE)
    EntityData* CurrentControllingEntity;
    CPROPERTY(NOTYPINGS)
    PlayerRequestingMessage playerRequests;

    DECLARE_COMPONENT_METHODS(FlyingPlayerController)

    // Inherited methods
    void onComponentRemoved(EntityData* entData) {
        if (CurrentControllingEntity != nullptr && IsControllingPawn() == false) {
            auto Cont = EntityComponentSystem::GetComponent<ControllableEntity>(CurrentControllingEntity);
            std::unique_lock lock(writeMutex);
            Cont->CurrentController = nullptr;
        }
    }

    // Methods
    bool IsControllingPawn() { return ControlledPawn != nullptr && CurrentControllingEntity != nullptr && CurrentControllingEntity == ControlledPawn; }

    bool ChangeControlledTarget(EntityData* newTarget, EntityData* playerEnt) {
        // Check this item can be controlled
        auto newControllable = EntityComponentSystem::GetComponent<ControllableEntity>(newTarget);
        {
            std::shared_lock readLock(newControllable->writeMutex);
            if (newControllable != nullptr && newControllable->CurrentController != nullptr) {
                // Item is already controlled!
                return false;
            }
        }

        // Remove old target
        if (CurrentControllingEntity != nullptr) {
            auto oldComp = EntityComponentSystem::GetComponent<ControllableEntity>(CurrentControllingEntity);
            std::unique_lock oldC(oldComp->writeMutex);
            oldComp->CurrentController = nullptr;
        }

        // Set new target
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
        EntityComponentSystem::MarkCompToNetwork<PlayerCoreComponent>(playerEnt);

        return true;
    }

    void SpawnPlayerPawn(EntityData* owner) {
        // Basic setup
        auto pawnEnt = EntityComponentSystem::AddEntity();
        std::unique_lock lock(writeMutex);
        ControlledPawn = pawnEnt;
        EntityComponentSystem::AddSetComponentToEntity(pawnEnt, new PlayerPawn());
        lock.unlock();
        PlayerPawn::SetupPlayerPawn(pawnEnt);
        ChangeControlledTarget(pawnEnt, owner);
    }

    static void UpdatePlayerControllers(bool init, double deltaTime) {
        // Setup Flying PC
        auto noPC = EntityComponentSystem::GetEntitiesWithData({typeid(PlayerCoreComponent)}, {typeid(FlyingPlayerController)});
        EntityTaskRunners::AutoPerformTasksParallel("setupPlayerControl", noPC, setupFlyingControl, deltaTime);

        // Iterate through all player controllers
        auto allPC = EntityComponentSystem::GetEntitiesWithData({typeid(FlyingPlayerController)}, {});
        EntityTaskRunners::AutoPerformTasksParallel("PlayerControlUpdate", allPC, updateFlyingControl, deltaTime);
    }

private:
    static void setupFlyingControl(double dt, EntityData* item) {
        const auto pc = new FlyingPlayerController();
        EntityComponentSystem::AddSetComponentToEntity(item, pc);
        pc->SpawnPlayerPawn(item);
        std::cout << "Setup Player controller" << std::endl;
    }

    static void updateFlyingControl(double dt, EntityData* item) {
        auto playerComp = EntityComponentSystem::GetComponent<FlyingPlayerController>(item);
        // Control our CurrentControllingEntity
        if (!playerComp->CurrentControllingEntity) {
            return;
        }
        auto controlComp = EntityComponentSystem::GetComponent<ControllableEntity>(playerComp->CurrentControllingEntity);
        if (controlComp == nullptr) {
            return;
        }

        // Set values in our controlled component controllers
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

        // TODO: If no requests after a while from player simply revert back to
        // nothing in case dc etc?
    }
};