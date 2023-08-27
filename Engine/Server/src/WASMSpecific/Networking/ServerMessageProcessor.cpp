#include "ServerMessageProcessor.h"
#include "Networking/ClientNetworkingData.hpp"
#include "Networking/NetworkingMessageTypes.hpp"
#include "SaveLoad/ComponentLoader.h"
#include "SaveLoad/EntityLoader.h"
#include "Utils/ChronoUtils.h"
#include "Utils/MathUtils.h"
#include <iostream>
#include <map>
#include <msgpack.hpp>

void processEntityPayloadMessage(std::map<std::string, msgpack::object> message) {
    std::cout << "entities payload" << std::endl;
    std::map<std::string, msgpack::object> payload;
    message.find("P")->second.convert(payload);
    //Addition of entities
    const auto keys = EntityLoader::GetNumerisedComponentKeys(payload.find("T")->second);
    NetworkManager::componentMappings.insert(NetworkManager::componentMappings.end(), keys.begin(), keys.end());

    const auto templatedEnts = EntityLoader::GetTemplateFromMsgpackFormat(NetworkManager::componentMappings, payload.find("C")->second);
    EntityLoader::LoadTemplateToExistingEntities(templatedEnts, false);
    //Deletion of entities
    const auto deletions = payload.find("D")->second;
    //No deletions if empty string
    if (deletions.type == msgpack::type::STR) {
        return;
    }
    std::map<uint64_t, msgpack::object> deletionsMap;
    deletions.convert(deletionsMap);
    for (const auto& item : deletionsMap) {
        EntityData* entData = EntityComponentSystem::GetComponentDataForEntity(item.first);
        if (!entData) {
            continue;
        }

        std::vector<std::string> compDeletions;
        item.second.convert(compDeletions);
        //Full deletion?
        if (compDeletions.size() == 1 && compDeletions[0] == "__F__") {
            EntityComponentSystem::DelayedRemoveEntity(entData);
            //Partial deletion?
        } else {
            for (const auto& comp : compDeletions) {
                EntityComponentSystem::DelayedRemoveComponent(entData, ComponentLoader::GetComponentTypeFromName(comp));
            }
        }
    }
}

void processPlayerIDMessage(std::map<std::string, msgpack::object> message) {
    ClientNetworkingData::playerId = message.find("P")->second.as<std::string>();
    std::cout << "player connection unique Id: " << ClientNetworkingData::playerId << std::endl;
}

void processLatencyFromMessage(std::map<std::string, msgpack::object> message) {
    const auto currentTime = ChronoUtils::get_time_since_epoch();
    const auto sendTime = message.find("T")->second.as<double>();
    const double newLatency = currentTime - sendTime;
    if (ClientNetworkingData::EstimatedLatency == 0) {
        ClientNetworkingData::EstimatedLatency = newLatency;
    } else {
        ClientNetworkingData::EstimatedLatency = MathUtils::ExponentialMovingAverage(ClientNetworkingData::EstimatedLatency, newLatency, 0.1);
    }
}

void NetworkManager::ProcessServerMessage(std::vector<uint8_t> messageData) {
    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(messageData.data()), messageData.size());
    msgpack::object obj = oh.get();
    std::map<std::string, msgpack::object> deserialized_map;
    obj.convert(deserialized_map);

    const auto messageTypeIt = deserialized_map.find("M");
    if (messageTypeIt == deserialized_map.end()) {
        std::cerr << "No message type for networking message " << std::endl;
        return;
    }
    if (messageTypeIt->second.type != msgpack::type::POSITIVE_INTEGER) {
        std::cerr << "Message type for networking message in incorrect format " << std::endl;
        return;
    }

    const PlayerSendMessageType messageType = static_cast<PlayerSendMessageType>(messageTypeIt->second.as<uint8_t>());

    if (messageType == PlayerSendMessageType::TEMP_PlayerID) {
        processPlayerIDMessage(deserialized_map);
    } else if (messageType == PlayerSendMessageType::EntitiesPayload) {
        processEntityPayloadMessage(deserialized_map);
    }
    processLatencyFromMessage(deserialized_map);
}