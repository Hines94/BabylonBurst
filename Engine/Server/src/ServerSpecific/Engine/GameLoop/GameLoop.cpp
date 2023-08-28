#include "GameLoop.h"
#include "Engine/Networking/NetworkingManager.h"
#include "Engine/Player/PlayerConnectionManager.h"
#include "Engine/Player/PlayerMessageProcessor.h"
#include "Engine/TestSenarios/TestingController.hpp"
#include "Engine/Utils/Environment.h"

bool GameLoop::InitialFrame_Update() {
    //Wait for networking to start properly
    if (NetworkingManager::instance == nullptr) {
        return false;
    }

    //Perform Players update
    UpdateSystem(systemInit, deltaTime, PlayerConnectionManager::ManagePlayers, "SpawnPlays");

    //Process messages
    UpdateSystem(systemInit, deltaTime, PlayerMessageProcessor::processPlayerMessages, "PlayerMsgs");

    return true;
}

void GameLoop::PostPhysicsSetup_PrePhysicsRun_Update() {
}

float GetNetworkUpdatingFreq() {
    auto freq = Environment::GetEnvironmentVariable("NET_TICK_RATE");
    if (freq != "") {
        return 1 / std::stof(freq);
    }
    return Settings::getInstance().networkingUpdateFreq;
}

void GameLoop::EndOfFrame_Update() {
    //Send network updates to players
    UpdateSystem(systemInit, deltaTime, PlayerConnectionManager::UpdatePlayerNetworking, "UpdNetwork", GetNetworkUpdatingFreq());

    //Update testing
    UpdateSystem(systemInit, deltaTime, TestingController::UpdateTesting, "UpdTests");
}
