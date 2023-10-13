#include "Engine/GameLoop/GameLoop.h"
#include "Engine/Utils/Environment.h"
#include "Engine/Utils/PerfTracking.h"
#include "WASM_INTERFACE/WASMAwsInterface.h"
#include "WASM_INTERFACE/WASMEntityInterface.h"
#include "wasmSetup.h"
#include <iostream>
#include <thread>

int main() {
    std::cout << "---Babylon Burst Client WASM Module Starting---" << std::endl;
    Environment::LoadEnvironmentVariables();
    PerfTracking& perfTracking = PerfTracking::getInstance(); //Dummy perf tracker
    WASMSetup::SetupWASM();
    WASMAws::setupAwsWASMInterface();
    WASMEntity::setupEntityWASMInterface();
    std::cout << "WASM setup. Initialising WASM game loop." << std::endl;
    GameLoop& gameLoop = GameLoop::getInstance();
    gameLoop.UpdateSingleGameLoop();
    return 0;
}