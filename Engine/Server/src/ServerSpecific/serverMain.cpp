#include "GameLoop/GameLoop.h"
#include "Networking/NetworkingManager.h"
#include "Utils/Environment.h"
#include "Utils/PerfTracking.h"
#include "serverSetup.h"
#include <iostream>
#include <thread>

int main() {
    std::cout << "---Space Fleets Server Starting---" << std::endl;
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