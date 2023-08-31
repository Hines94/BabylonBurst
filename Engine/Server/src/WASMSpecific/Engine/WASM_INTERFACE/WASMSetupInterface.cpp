#include "WASMSetupInterface.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/Navigation/NavmeshBuildSystem.h"
#include "Engine/Rendering/ExtractedMeshSerializer.h"
#include "Engine/Rendering/ModelLoader.h"
#include <emscripten/bind.h>
#include <iostream>

namespace WASMSetup {
    std::string WASMModuleIdentifier = "";
}

using namespace emscripten;

std::vector<uint8_t> GetModelCallback(std::string file, std::string modelName, int fileIndex) {
    emscripten::val jsArray = emscripten::val::global("RequestModelData")(file, modelName, fileIndex, WASMSetup::WASMModuleIdentifier);
    std::vector<uint8_t> data;
    unsigned length = jsArray["length"].as<unsigned>();
    for (unsigned i = 0; i < length; ++i) {
        data.push_back(jsArray[i].as<uint8_t>());
    }
    return data;
}

void NavmeshRebuild(ExtractedModelData data) {
    const auto buffer = ExtractedMeshSerializer::GetBufferForExtractedMesh(data);
    emscripten::val::global("OnNavmeshRebuild")(emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data())), WASMSetup::WASMModuleIdentifier);
}

void HeightfieldRebuild(ExtractedModelData data) {
    const auto buffer = ExtractedMeshSerializer::GetBufferForExtractedMesh(data);
    emscripten::val::global("OnHeightfieldRebuild")(emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data())), WASMSetup::WASMModuleIdentifier);
}

void SetupWASMModule(std::string uniqueModuleId) {
    WASMSetup::WASMModuleIdentifier = uniqueModuleId;
    //Setup prefabs - Needs to be after get uuid so we can call async functions in AWS interface
    PrefabManager::getInstance().RefreshPrefabs();
    PrefabManager::getInstance().onAllPrefabsLoaded.addListener([](PrefabManager* instance) {
        std::cout << "Prefab Manager fully loaded" << std::endl;
        WASMSetup::callWASMSetupComplete();
    });
    ModelLoader::getInstance().SetGetMeshCallback(GetModelCallback);
    NavmeshBuildSystem::getInstance().onNavmeshRebuild.addListener(NavmeshRebuild);
    NavmeshBuildSystem::getInstance().onHeightfieldRebuild.addListener(HeightfieldRebuild);
}

void WASMSetup::callWASMSetupComplete() {
    emscripten::val::global("WASMSetupComplete")(WASMSetup::WASMModuleIdentifier);
}

EMSCRIPTEN_BINDINGS(WASMSetupInterface) {
    function("SetupWASMModule", &SetupWASMModule);
}
