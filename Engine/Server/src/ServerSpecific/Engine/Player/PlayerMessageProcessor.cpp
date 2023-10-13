#include "PlayerMessageProcessor.h"
#include "Engine/Networking/NetworkingManager.h"

void PlayerMessageProcessor::processPlayerMessages(bool SystemInit, double deltaTime) {
    //Get messages
    std::map<uint, std::vector<std::pair<std::string, std::vector<uint8_t>>>> playerMessages = NetworkingManager::instance->GetClearPlayerMessages();

    //For each subsystem process the messages
    for (const auto message : PlayerMessageProcessor::registeredPlayerMessages) {
        const auto taskName = "PlayerMessages_" + message.first;
        EntityTaskRunners::AutoPerformTasksParallel<std::pair<std::string, std::vector<uint8_t>>>(taskName, playerMessages[message.first], message.second, deltaTime);
    }
}