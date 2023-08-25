#include "WASMSetupInterface.h"
#include "Entities/Prefabs/PrefabManager.h"
#include <emscripten/bind.h>
#include <iostream>

namespace WASMSetup {
    std::string WASMModuleIdentifier = "";
}

using namespace emscripten;

void SetupWASMModule(std::string uniqueModuleId) {
    WASMSetup::WASMModuleIdentifier = uniqueModuleId;
    //Setup prefabs - Needs to be after get uuid so we can call async functions in AWS interface
    PrefabManager::getInstance().RefreshPrefabs();
    PrefabManager::getInstance().onAllPrefabsLoaded.addListener([](PrefabManager* instance) {
        std::cout << "Prefab Manager fully loaded" << std::endl;
        WASMSetup::callWASMSetupComplete();
    });
}

void WASMSetup::callWASMSetupComplete() {
    emscripten::val::global("WASMSetupComplete")(WASMSetup::WASMModuleIdentifier);
}

EMSCRIPTEN_BINDINGS(WASMSetupInterface) {
    function("SetupWASMModule", &SetupWASMModule);
}
