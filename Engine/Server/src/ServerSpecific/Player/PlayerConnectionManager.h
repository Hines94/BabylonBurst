#pragma once
#include "StorageTypes.hpp"
#include <map>
#include <memory>
#include <string>
#include <unordered_set>
#include <vector>

struct playerConnectionDetails {
    bool bInit;
    uint64_t playerEnt;
    std::unordered_set<uint64_t> NetworkedEntities;
};

//Responsible for running our player oriented methods - spawning in new players, saving their messages, sending down updates etc
class PlayerConnectionManager {
public:
    PlayerConnectionManager();
    static void ManagePlayers(bool firstTime, double dt);
    static void UpdatePlayerNetworking(bool firstTime, double dt);

    uint64_t GetPlayerEntity(std::string uuid);

    void RecordDataOut();

public:
    static PlayerConnectionManager& getInstance() {
        static PlayerConnectionManager instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    PlayerConnectionManager(PlayerConnectionManager const&) = delete;
    void operator=(PlayerConnectionManager const&) = delete;

private:
    //Maps to player account id
    std::map<std::string, std::shared_ptr<playerConnectionDetails>> connectedPlayers = {};
    uint numberConnections = 0;
    double timeSinceUpdate = 0;
    int numberNumerisedParams = 0;

    std::vector<std::pair<std::string, std::vector<std::string>>> getNumerisedChanges();

    static void removeOldPlayers(std::unordered_set<std::string> oldPlayers);
    static void addNewPlayers(std::unordered_set<std::string> oldPlayers);
};