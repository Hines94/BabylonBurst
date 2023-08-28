#include "PlayerConnectionManager.h"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/Networking/NetworkingManager.h"
#include "Engine/Networking/NetworkingMessageTypes.hpp"
#include "Engine/Player/PlayerCoreComponent.hpp"
#include "Engine/SaveLoad/ComponentLoader.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include "Engine/Utils/PerfTracking.h"
#include "Engine/Utils/Settings.h"
#include "Engine/Utils/StringUtils.h"
#include <iostream>
#include <msgpack.hpp>
#include <string>

PlayerConnectionManager::PlayerConnectionManager() {
}

const std::pair<std::unordered_set<std::string>, std::unordered_set<std::string>> getNewRemovedPlayers() {
    std::lock_guard<std::mutex> try_lock(NetworkingManager::instance->newSocketMut);
    std::pair<std::unordered_set<std::string>, std::unordered_set<std::string>> ret(
        NetworkingManager::instance->GetNewSockets(),
        NetworkingManager::instance->GetRemovedSockets());
    NetworkingManager::instance->ResetNewSockets();
    return ret;
}

uint64_t PlayerConnectionManager::GetPlayerEntity(std::string uuid) {
    //TODO: Change this at some point to make connection agnostic!
    if (connectedPlayers.count(uuid) == 0) {
        return 0;
    }
    return connectedPlayers[uuid]->playerEnt;
}

void PlayerConnectionManager::removeOldPlayers(std::unordered_set<std::string> oldPlayers) {
    if (oldPlayers.size() == 0) {
        return;
    }
    //TODO: leave method - remove pawns etc?
    auto& inst = PlayerConnectionManager::getInstance();
    for (const auto& playerUuid : oldPlayers) {
        auto player = inst.GetPlayerEntity(playerUuid);
        if (player != 0) {
            auto data = EntityComponentSystem::GetComponentDataForEntity(player);
            EntityComponentSystem::DelayedRemoveEntity(data);
        }
        inst.connectedPlayers.erase(playerUuid);
    }
}

void PlayerConnectionManager::addNewPlayers(std::unordered_set<std::string> newSessions) {
    if (newSessions.size() == 0) {
        return;
    }

    auto& inst = PlayerConnectionManager::getInstance();

    for (const auto& playerUuid : newSessions) {
        //Create new player object?
        if (inst.GetPlayerEntity(playerUuid) == 0) {
            auto newPlayer = EntityComponentSystem::AddEntity();
            PlayerCoreComponent::createNewPlayer(newPlayer, playerUuid);
            std::shared_ptr<playerConnectionDetails> newConnectData = std::make_shared<playerConnectionDetails>();
            newConnectData->playerEnt = newPlayer->owningEntity;
            inst.connectedPlayers.insert(std::pair(playerUuid, newConnectData));
        }

        inst.connectedPlayers[playerUuid].get()->bInit = false;

        //TODO: Temp - Send message stating player unique id - replace with some easy id
        auto messageDetails = NetworkingManager::GetBufferToSend();
        messageDetails.second->pack(playerUuid);
        NetworkingManager::instance->sendMessageToPlayer(playerUuid,
                                                         static_cast<uint32_t>(PlayerSendMessageType::TEMP_PlayerID),
                                                         messageDetails);
    }
}

void PlayerConnectionManager::ManagePlayers(bool firstTime, double dt) {
    //Get new sessions copy
    const std::pair<std::unordered_set<std::string>, std::unordered_set<std::string>> newSessions = getNewRemovedPlayers();
    removeOldPlayers(newSessions.second);
    addNewPlayers(newSessions.first);
}

// ---------------------- DATA TO PLAYER ------------------------------

bool IsNetworkedForPlayer(EntityData* ent, const tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>>& comps) {
    //TODO: Spatial or player stuff?

    if (!EntityComponentSystem::IsValid(ent)) {
        return false;
    }

    PackerDetails p = {.dt = ComponentDataType::Network, .isSizingPass = true};

    for (auto& c : ent->components) {
        if (comps.size() > 0 && comps.find(c.first) == comps.end()) {
            continue;
        }
        if (!c.second) {
            continue;
        }

        //If specific properties check those?
        auto it = comps.find(c.first);
        if (it != comps.end()) {
            p.propsToNetwork = it->second;
        }
        const auto defaultComp = PrefabManager::getInstance().TryGetDefaultPrefabComp(ent, ComponentLoader::GetNameFromComponent(c.second));
        c.second->GetComponentData(p, true, defaultComp);
        delete (defaultComp);
        if (p.packSize > 0) {
            return true;
        }
    }

    return false;
}

void packPlayerData(const std::vector<std::pair<EntityData*, tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>>>>& NetworkedEnts, msgpack::packer<msgpack::sbuffer>* packer, std::shared_ptr<playerConnectionDetails> player) {
    //TODO: Relevant for player?
    EntitySaver::PackEntitiesData(NetworkedEnts, packer, true);
}

int getPlayerInitData(msgpack::packer<msgpack::sbuffer>* packer, std::shared_ptr<playerConnectionDetails> player) {

    auto allEnts = EntityComponentSystem::GetEntitiesWithData({}, {});
    //TODO: Get only nearby/relevant via spatial query

    //First do a pass getting the actual entities we are networking
    std::vector<std::pair<EntityData*, tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>>>> NetworkedEnts;
    tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>> dummy;
    for (auto bucket : allEnts->buckets) {
        for (auto ent : bucket->data) {
            if (IsNetworkedForPlayer(ent, dummy)) {
                NetworkedEnts.push_back(std::make_pair(ent, dummy));
                player.get()->NetworkedEntities.insert(ent->owningEntity);
            }
        }
    }

    //Next do pass packing data
    packPlayerData(NetworkedEnts, packer, player);

    player.get()->bInit = true;
    return NetworkedEnts.size();
}

int getPlayerAddData(const tbb::concurrent_unordered_map<EntityData*, tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>>>& additions, msgpack::packer<msgpack::sbuffer>* packer, std::shared_ptr<playerConnectionDetails> player) {
    //First do a pass getting the actual entities we are networking
    std::vector<std::pair<EntityData*, tbb::concurrent_unordered_map<std::type_index, tbb::concurrent_unordered_set<std::string>>>> NetworkedEnts;
    for (auto ent : additions) {
        if (IsNetworkedForPlayer(ent.first, ent.second)) {
            NetworkedEnts.push_back(std::make_pair(ent.first, ent.second));
            player.get()->NetworkedEntities.insert(ent.first->owningEntity);
        }
    }

    //Next do pass packing data
    packPlayerData(NetworkedEnts, packer, player);
    return NetworkedEnts.size();
}

void getPlayerDeleteData(const std::unordered_map<uint64_t, std::vector<std::string>>& deletions, msgpack::packer<msgpack::sbuffer>* packer, std::shared_ptr<playerConnectionDetails> player, int& changeSize) {
    if (deletions.size() == 0) {
        packer->pack("");
        return;
    }

    //First do a pass getting deletions relevant to our player
    std::unordered_map<uint64_t, std::vector<std::string>> relevantDeletions;
    for (auto& d : deletions) {
        if (player.get()->NetworkedEntities.contains(d.first) == false) {
            continue;
        }
        relevantDeletions.insert(d);
    }

    //Next do pass packing deleted entities
    packer->pack_map(relevantDeletions.size());
    for (auto& d : relevantDeletions) {
        packer->pack(d.first);
        auto& delComps = d.second;
        packer->pack_array(delComps.size());
        for (auto& c : delComps) {
            packer->pack(c);
        }
    }

    changeSize += deletions.size();
}

void PlayerConnectionManager::UpdatePlayerNetworking(bool firstTime, double dt) {
    auto& inst = getInstance();
    auto additions = EntityComponentSystem::GetNetworkData();
    auto deletions = EntityComponentSystem::GetDeletedNetworkData();
    auto parameterChanges = inst.getNumerisedChanges();

    std::vector<std::future<void>> futures;
    for (int i = 0; i < inst.connectedPlayers.size(); i++) {
        auto promise = std::make_shared<std::promise<void>>();
        auto future = promise->get_future();
        auto player = std::next(inst.connectedPlayers.begin(), i);

        //Work through each player
        ThreadPool::GetThreadPool().enqueue([&parameterChanges, &player, &additions, &deletions, promise] {
            auto messageSend = NetworkingManager::GetBufferToSend();
            messageSend.second->pack_map(3);

            auto changeSize = 0;

            //First param details
            auto paramsSend = EntityComponentSystem::GetParameterMappings();
            if (player->second.get()->bInit) {
                paramsSend = parameterChanges;
            }
            messageSend.second->pack("T");
            messageSend.second->pack(paramsSend);

            //First addition data
            messageSend.second->pack("C");
            if (player->second.get()->bInit == false) {
                changeSize = getPlayerInitData(messageSend.second, player->second);
            } else {
                changeSize = getPlayerAddData(additions, messageSend.second, player->second);
            }

            //Now deletion data
            messageSend.second->pack("D");
            getPlayerDeleteData(deletions, messageSend.second, player->second, changeSize);

            //Process & send
            if (changeSize > 0 || paramsSend.size() > 0) {
                NetworkingManager::instance->sendMessageToPlayer(player->first,
                                                                 static_cast<uint32_t>(PlayerSendMessageType::EntitiesPayload),
                                                                 messageSend);
            } else {
                delete (messageSend.first);
                delete (messageSend.second);
            }

            promise->set_value();
        });
        futures.push_back(std::move(future));
    }

    // Start waiting
    for (auto& future : futures) {
        future.get();
    }

    //Record data sent this cycle
    NetworkingManager::instance->RecordDataOut();

    //Reset all network data
    EntityComponentSystem::ClearNetworkData();
}

std::vector<std::pair<std::string, std::vector<std::string>>> PlayerConnectionManager::getNumerisedChanges() {
    auto numerisedParams = EntityComponentSystem::GetParameterMappings();
    if (numerisedParams.size() == numberNumerisedParams) {
        return {};
    }
    std::vector<std::pair<std::string, std::vector<std::string>>> Ret;
    for (int i = numberNumerisedParams; i < numerisedParams.size(); i++) {
        Ret.push_back(numerisedParams[i]);
    }
    numberNumerisedParams = numerisedParams.size();
    return Ret;
}