#pragma once
#include "Building/BuildingSystem.h"
#include "Building/NewBuildableSetup.hpp"
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Player/PlayerConnectionManager.h"
#include "Player/PlayerBuildingComponent.hpp"
#include <nlohmann/json.hpp>

struct PlayerPlaceItemMessage {
    std::string ItemType;
    EntVector3 Position;
    EntVector3 Rotation;
    EntVector3 Scale;
};

void from_json(const nlohmann::json& j, PlayerPlaceItemMessage& p) {
    j.at("ItemType").get_to(p.ItemType);
    j.at("Position").get_to(p.Position);
    j.at("Rotation").get_to(p.Rotation);
    j.at("Scale").get_to(p.Scale);
};

namespace PlayerItemPlaceProcessor {
    void processPlayerPlaceItemInput(double dt, std::pair<std::string, std::string> task) {
        // First get player ent and comp
        auto playerEnt = PlayerConnectionManager::getInstance().GetPlayerEntity(task.first);
        auto playerData = EntityComponentSystem::GetComponentDataForEntity(playerEnt);

        // If not exists then continue
        if (EntityComponentSystem::IsValid(playerData) == false) {
            return;
        }

        // Add build comp if not exists
        if (!EntityComponentSystem::HasComponent<PlayerBuildingComponent>(playerData)) {
            EntityComponentSystem::AddSetComponentToEntity(playerData, new PlayerBuildingComponent());
        }
        auto playerBComp = EntityComponentSystem::GetComponent<PlayerBuildingComponent>(playerData);

        // Check building ship is valid
        auto buildingShip = playerBComp->CurrentBuildItem;
        if (buildingShip == nullptr) {
            return;
        }

        // Decode message and create item
        try {
            PlayerPlaceItemMessage playerBuildRequest = nlohmann::json::parse(task.second).get<PlayerPlaceItemMessage>();

            BuildableObject* item = BuildingSystem::GetBuildableObject(playerBuildRequest.ItemType);
            if (item == nullptr) {
                std::cerr << "Player item: " << playerBuildRequest.ItemType << " not found!" << std::endl;
                return;
            }

            // TODO: Check cost etc
            auto spawnedInstances = item->GenerateObjectCopy();
            // TODO: Setup object specific to our player
            std::cout << "Created object: " << item->ItemID << std::endl;

        } catch (nlohmann::json::parse_error& e) {
            std::cerr << "ERROR: issue decoding place item msg from player " << e.what() << std::endl;
            return;
        }
    }
} // namespace PlayerItemPlaceProcessor
  // PlayerItemPlaceProcessor