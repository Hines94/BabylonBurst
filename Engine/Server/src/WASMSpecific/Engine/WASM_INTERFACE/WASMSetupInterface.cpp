#include "WASMSetupInterface.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/Navigation/NavmeshBuildSetup.h"
#include "Engine/Navigation/NavmeshBuildSystem.h"
#include "Engine/Rendering/ExtractedMeshSerializer.h"
#include "Engine/Rendering/ModelLoader.h"
#include "Engine/Utils/VisualMessageShower.h"
#include <emscripten/bind.h>
#include <iostream>

namespace WASMSetup {
    std::string WASMModuleIdentifier = "";
}

using namespace emscripten;

std::vector<uint8_t> GetModelCallback(std::string file, std::string fileName, std::string modelName) {
    emscripten::val jsArray = emscripten::val::global("RequestModelData")(file, fileName, modelName, WASMSetup::WASMModuleIdentifier);
    std::vector<uint8_t> data;
    unsigned length = jsArray["length"].as<unsigned>();
    for (unsigned i = 0; i < length; ++i) {
        data.push_back(jsArray[i].as<uint8_t>());
    }
    return data;
}

void NavmeshRebuild(ExtractedModelData data, std::string stage) {
    const auto buffer = ExtractedMeshSerializer::GetBufferForExtractedMesh(data);
    emscripten::val::global("OnNavStageBuild")(emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data())), stage, WASMSetup::WASMModuleIdentifier);
}

void NavmeshContoursRebuild(std::vector<LineSegment> contours) {
    const auto buffer = ExtractedMeshSerializer::GetBufferForLinesVector(contours);
    emscripten::val::global("OnNavCountorsBuild")(emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data())), WASMSetup::WASMModuleIdentifier);
}

void NavmeshRegionsRebuild(std::vector<ExtractedModelData> regions) {
    const auto buffer = ExtractedMeshSerializer::GetBufferForMeshVector(regions);
    emscripten::val::global("OnNavRegionsBuild")(emscripten::val(emscripten::typed_memory_view(buffer.size(), buffer.data())), WASMSetup::WASMModuleIdentifier);
}

void RequestErrorMessage(std::string message, float time) {
    emscripten::val::global("RequestVisualError")(message, time, WASMSetup::WASMModuleIdentifier);
}
void RequestInfoMessage(std::string message, float time) {
    emscripten::val::global("RequestVisualInfo")(message, time, WASMSetup::WASMModuleIdentifier);
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
    //TODO: This should be only if we are in some sort of debug mode or Editor?
    NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.addListener(NavmeshRebuild);
    NavmeshBuildSystem::getInstance().onNavmeshContoursRebuild.addListener(NavmeshContoursRebuild);
    NavmeshBuildSystem::getInstance().onNavmeshRegionsRebuild.addListener(NavmeshRegionsRebuild);
    VisualMessageShower::RequestVisibleErrorMessageShow.addListener(RequestErrorMessage);
    VisualMessageShower::RequestVisibleInfoMessageShow.addListener(RequestInfoMessage);
}

void WASMSetup::callWASMSetupComplete() {
    emscripten::val::global("WASMSetupComplete")(WASMSetup::WASMModuleIdentifier);
}

void RegenerateNavmesh() {
    EntityComponentSystem::GetOrCreateSingleton<NavmeshBuildSetup>()->performRebuild = true;
    std::cout << "Performing Navigation Rebuild" << std::endl;
}

EMSCRIPTEN_BINDINGS(WASMSetupInterface) {
    function("SetupWASMModule", &SetupWASMModule);
    function("RegenerateNavmesh", &RegenerateNavmesh);
}
