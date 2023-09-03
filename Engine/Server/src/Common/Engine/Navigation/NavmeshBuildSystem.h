#pragma once
#include "Engine/Rendering/ExtractedMeshData.h"
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

    //Final stage is just "NavMesh"
    Observable<ExtractedModelData, std::string> onNavmeshStageRebuild;
    Observable<std::vector<LineSegment>> onNavmeshContoursRebuild;
    Observable<std::vector<ExtractedModelData>> onNavmeshRegionsRebuild;
};