#pragma once
#include "Engine/Entities/EntityTaskRunners.hpp"
#include <cstdlib>
#include <functional>
#include <iostream>
#include <map>

namespace PlayerMessageProcessor {

    inline std::map<int, std::function<void(double, std::pair<std::string, std::string>)>> registeredPlayerMessages;

    void processPlayerMessages(bool SystemInit, double deltaTime);

    class Registrar {
    public:
        Registrar(int msgId, std::function<void(double, std::pair<std::string, std::string>)> func) {
            if (PlayerMessageProcessor::registeredPlayerMessages.find(msgId) != PlayerMessageProcessor::registeredPlayerMessages.end()) {
                std::cerr << "Tried to double register for player message type: " << msgId << std::endl;
                exit(EXIT_FAILURE); // Exit with an error code
            }
            PlayerMessageProcessor::registeredPlayerMessages.insert({msgId, func});
            std::cout << "Registered new client message type: " << msgId << std::endl;
        }
    };

} // namespace PlayerMessageProcessor

//The function includes: Delta time, Player connection Id (use PlayerConnectionManager::getInstance().GetPlayerEntity) and the JSON message.
#define REGISTER_PLAYER_MESSAGE(MsgId, func) \
    static PlayerMessageProcessor::Registrar _registrar_##MsgId(MsgId, func);
