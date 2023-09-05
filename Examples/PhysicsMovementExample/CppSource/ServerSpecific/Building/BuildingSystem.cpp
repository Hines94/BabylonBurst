#include "BuildingSystem.h"
#include "Engine/Aws/AwsManager.h"

void BuildingSystem::UpdateBuildSystem(bool SystemInit, double dt) {
    if (!SystemInit) {
        // TODO: Remove old code
        return;
        // Init csv
        // nlohmann::json data =
        // AwsManager::getInstance().GetJsonFromS3("stats/BaseBuildableStats.zip",
        // 0); for (auto it = data.begin(); it != data.end(); ++it) {
        //     std::string name = it.key();
        //     Buildables.insert(std::make_pair(name, new BuildableObject(name,
        //     it.value())));
        //     // do something with the key
        // }
    }
}

BuildableObject* BuildingSystem::GetBuildableObject(const std::string& name) {
    auto it = Buildables.find(name);
    if (it != Buildables.end()) {
        return it->second;
    }
    return nullptr;
}
