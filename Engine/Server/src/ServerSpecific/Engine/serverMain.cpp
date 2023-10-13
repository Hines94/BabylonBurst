#include "Engine/GameLoop/GameLoop.h"
#include "Engine/Networking/NetworkingManager.h"
#include "Engine/Utils/Environment.h"
#include "Engine/Utils/PerfTracking.h"
#include "serverSetup.h"
#include <iostream>
#include <thread>

int main() {
    std::cout << "---Babylon Burst Server Starting---" << std::endl;
    Environment::LoadEnvironmentVariables();
    PerfTracking& perfTracking = PerfTracking::getInstance(); //This sets up singleton
    ServerSetup::SetupGame();
    //Networking manager runs in second thread
    std::thread networkingThread(NetworkingManager::SetupNetworkingManager);
    //Game runs in main thread
    GameLoop& gameLoop = GameLoop::getInstance();
    gameLoop.EndlessRunGameLoop();
    return 0;
}