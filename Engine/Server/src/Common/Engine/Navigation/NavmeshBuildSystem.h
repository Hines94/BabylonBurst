#pragma once
#include "Engine/Rendering/ExtractedMeshData.hpp"
#include "Engine/Utils/Observable.hpp"
#include <atomic>
#include <functional>

class NavmeshBuildSystem {
public:
    NavmeshBuildSystem();

    static NavmeshBuildSystem& getInstance() {
        static NavmeshBuildSystem instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    static void RunSystem(bool Init, double dt);

    void PerformNavmeshRebuild();

    std::atomic<bool> meshUnbuilt;

    NavmeshBuildSystem(NavmeshBuildSystem const&) = delete;
    void operator=(NavmeshBuildSystem const&) = delete;

    Observable<ExtractedModelData> onNavmeshRebuild;
};