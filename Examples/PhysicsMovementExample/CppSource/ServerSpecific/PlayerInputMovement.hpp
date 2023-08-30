#pragma once

#include "Engine/Entities/EntitySystem.h"
#include "Engine/Player/PlayerConnectionManager.h"
#include "Player/FlyingPlayerController.hpp"
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

void from_json(const nlohmann::json& j, PlayerRequestingMessage& p) {
    j.at("Forward").get_to(p.RequestForwardAxis);
    j.at("Side").get_to(p.RequestSideAxis);
    j.at("Up").get_to(p.RequestUpAxis);
    j.at("Yaw").get_to(p.RequestYawLook);
    j.at("Pitch").get_to(p.RequestPitchLook);
    j.at("Roll").get_to(p.RequestRollLook);
}

namespace PlayerMoveProcessor {

    void processPlayerMovementInput(double dt, std::pair<std::string, std::string> task) {
        // First get player ent and comp
        auto playerEnt = PlayerConnectionManager::getInstance().GetPlayerEntity(task.first);
        auto playerData = EntityComponentSystem::GetComponentDataForEntity(playerEnt);

        // If not exists then continue
        if (EntityComponentSystem::IsValid(playerData) == false) {
            return;
        }

        auto playerComp = EntityComponentSystem::GetComponent<FlyingPlayerController>(playerData);
        if (!EntityComponentSystem::IsValid(playerComp->CurrentControllingEntity)) {
            return;
        }

        // Decode message
        try {
            playerComp->playerRequests = nlohmann::json::parse(task.second).get<PlayerRequestingMessage>();
        } catch (nlohmann::json::parse_error& e) {
            std::cerr << "ERROR: issue decoding inputs from player " << e.what() << std::endl;
            return;
        }
    }
} // namespace PlayerMoveProcessor
  // PlayerMoveProcessor
