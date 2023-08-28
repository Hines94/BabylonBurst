#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include <nlohmann/json.hpp>
#include <string>

//Core component - Added to our player entity once spawned so we can track players & connections
struct PlayerCoreComponent : public Component {
    CPROPERTY(NET, SAVE)
    std::string Playeruuid;

    DECLARE_COMPONENT_METHODS(PlayerCoreComponent)

    static void createNewPlayer(EntityData* playerData, std::string uuid) {
        auto pc = new PlayerCoreComponent();
        pc->Playeruuid = uuid;
        EntityComponentSystem::AddSetComponentToEntity(playerData, pc);
    }
};