#pragma once
#include "Entities/Building/NewShipSetup.hpp"
#include "Entities/EntitySystem.h"
#include "PlayerBuildingComponent.hpp"
#include <nlohmann/json.hpp>

//Requested movement instructions
struct PlayerBuildingMessage {
    int RequestType;
    Entity TargetItem;
};

void from_json(const nlohmann::json& j, PlayerBuildingMessage& p) {
    j.at("RequestType").get_to(p.RequestType);
    j.at("TargetItem").get_to(p.TargetItem);
};

namespace PlayerBeginBuildProcessor {
    void processPlayerBeginBuildInput(double dt, std::pair<std::string, std::string> task) {
        //First get player ent and comp
        auto playerEnt = PlayerConnectionManager::getInstance().GetPlayerEntity(task.first);
        auto playerData = EntityComponentSystem::GetComponentDataForEntity(playerEnt);

        // If not exists then continue
        if (EntityComponentSystem::IsValid(playerData) == false) {
            return;
        }

        //Add build comp if not exists
        if (!EntityComponentSystem::HasComponent<PlayerBuildingComponent>(playerData)) {
            EntityComponentSystem::AddSetComponentToEntity(playerData, new PlayerBuildingComponent());
        }
        auto playerBComp = EntityComponentSystem::GetComponent<PlayerBuildingComponent>(playerData);

        //Decode message and set building
        try {
            PlayerBuildingMessage playerBuildRequest = nlohmann::json::parse(task.second).get<PlayerBuildingMessage>();
            //is stop building
            if (playerBuildRequest.RequestType == 1) {
                std::unique_lock lock(playerBComp->writeMutex);
                playerBComp->CurrentBuildItem = nullptr;
                return;
            }
            //is requesting a new build
            if (playerBuildRequest.RequestType == 2) {
                //TODO: Check permission to generate new!
                auto buildItem = NewShipSetup::GenerateNewShip();
                std::unique_lock lock(playerBComp->writeMutex);
                playerBComp->CurrentBuildItem = buildItem;
                //Else requesting build to existing item
            } else if (playerBuildRequest.RequestType == 3) {
                auto buildItem = EntityComponentSystem::GetComponentDataForEntity(playerBuildRequest.TargetItem);
                if (EntityComponentSystem::IsValid(buildItem)) {
                    //TODO: Check they have permission etc!
                    std::unique_lock lock(playerBComp->writeMutex);
                    playerBComp->CurrentBuildItem = buildItem;
                }
            }

            EntityComponentSystem::MarkCompToNetwork<PlayerBuildingComponent>(playerData);
        } catch (nlohmann::json::parse_error& e) {
            std::cerr << "ERROR: issue decoding begin build msg from player " << e.what() << std::endl;
            return;
        }
    }
} // namespace PlayerBeginBuildProcessor