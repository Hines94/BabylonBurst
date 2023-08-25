#include "GameLoop/GameLoop.h"
#include "Utils/Environment.h"
#include "Utils/PerfTracking.h"
#include "WASM_INTERFACE/WASMAwsInterface.h"
#include "wasmSetup.h"
#include <iostream>
#include <thread>

int main() {
    std::cout << "---Space Fleets Client WASM Module Starting---" << std::endl;
    Environment::LoadEnvironmentVariables();
    PerfTracking& perfTracking = PerfTracking::getInstance(); //Dummy perf tracker
    WASMAws::setupAwsWASMInterface();
    WASMSetup::SetupWASM();
    std::cout << "WASM setup. Initialising WASM game loop." << std::endl;
    GameLoop& gameLoop = GameLoop::getInstance();
    gameLoop.UpdateSingleGameLoop();
    return 0;
}