#pragma once
#include "Entities/EntityTaskRunners.hpp"
#include "Networking/NetworkingManager.h"
#include "PlayerController.hpp"
#include "PlayerInputBeginBuilding.hpp"
#include "PlayerInputMovement.hpp"
#include "PlayerInputPlaceItem.hpp"

namespace PlayerMessageProcessor {

    enum PlayerMessageType {
        PlayerMessageInputs,
        PlayerMessagePlaceItem,
        PlayerMessageRemoveBuild,
        PlayerMessageInteract,
        PlayerBeginBuilding,
        PlayerAddDecal
    };

    void processPlayerMessages(bool FirstTime, double deltaTime) {
        //Get messages
        std::map<uint, std::vector<std::pair<std::string, std::string>>> playerMessages = NetworkingManager::instance->GetClearPlayerMessages();
        //For each subsystem process the messages. TODO: This causes issues when runing parallel for some reason (unsure)
        EntityTaskRunners::AutoPerformTasksParallel<std::pair<std::string, std::string>>("ProcessInputs", playerMessages[PlayerMessageType::PlayerMessageInputs], PlayerMoveProcessor::processPlayerMovementInput, 0.0);
        EntityTaskRunners::AutoPerformTasksParallel<std::pair<std::string, std::string>>("ProcessInputs", playerMessages[PlayerMessageType::PlayerBeginBuilding], PlayerBeginBuildProcessor::processPlayerBeginBuildInput, 0.0);
        EntityTaskRunners::AutoPerformTasksParallel<std::pair<std::string, std::string>>("ProcessInputs", playerMessages[PlayerMessageType::PlayerMessagePlaceItem], PlayerItemPlaceProcessor::processPlayerPlaceItemInput, 0.0);
        PlayerController::UpdatePlayerControllers(FirstTime, deltaTime);
    }
} // namespace PlayerMessageProcessor