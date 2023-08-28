#pragma once
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Networking/NetworkingManager.h"
#include <cstdlib>
#include <map>

namespace PlayerMessageProcessor {

    inline std::map<int, std::function<void(double, std::pair<std::string, std::string>)>> registeredPlayerMessages;

    void processPlayerMessages(bool FirstTime, double deltaTime) {
        //Get messages
        std::map<uint, std::vector<std::pair<std::string, std::string>>> playerMessages = NetworkingManager::instance->GetClearPlayerMessages();

        //For each subsystem process the messages. TODO: This causes issues when runing parallel for some reason (unsure)
        for (const auto message : PlayerMessageProcessor::registeredPlayerMessages) {
            const auto taskName = "PlayerMessages_" + message.first;
            EntityTaskRunners::AutoPerformTasksParallel<std::pair<std::string, std::string>>(taskName, playerMessages[message.first], message.second, deltaTime);
        }
    }

    void RegisterPlayerMessageType(int type, std::function<void(double, std::pair<std::string, std::string>)> function) {
        if (PlayerMessageProcessor::registeredPlayerMessages.find(type) != PlayerMessageProcessor::registeredPlayerMessages.end()) {
            std::cerr << "Tried to double register for player message type: " << type << std::endl;
            exit(EXIT_FAILURE); // Exit with an error code
        }
        PlayerMessageProcessor::registeredPlayerMessages.insert(std::pair(type, function));
    }

} // namespace PlayerMessageProcessor

//The function includes: Delta time, Player connection Id (use PlayerConnectionManager::getInstance().GetPlayerEntity) and the JSON message
#define REGISTER_PLAYER_MESSAGE(MsgId, func) \
    PlayerMessageProcessor::Instance().RegisterMessage(msg_id, func)
