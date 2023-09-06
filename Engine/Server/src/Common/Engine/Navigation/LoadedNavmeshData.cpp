#include "LoadedNavmeshData.h"
#include "NavmeshBuildSystemDebugMethods.cpp"
#include "recastnavigation/DetourNavMeshQuery.h"
#include <cstdlib>

float frand() {
    return static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
}

void LoadedNavmeshData::onComponentAdded(EntityData* entData) {
    if (navmeshData.empty()) {
        return;
    }
    auto status = loadednavmesh.init(reinterpret_cast<unsigned char*>(&navmeshData[0]), navmeshData.size(), DT_TILE_FREE_DATA);
    if (!dtStatusSucceed(status)) {
        std::cerr << "Failed to init navmesh with saved data: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << std::endl;
    } else {
        std::cout << "Navmesh loaded succesfully" << std::endl;
    }
}

bool LoadedNavmeshData::IsNavmeshValid() {
    // Check if there are tiles in the navmesh
    if (this->loadednavmesh.getMaxTiles() == 0) {
        return false;
    }

    return true;
}

dtNavMeshQuery* LoadedNavmeshData::GetPremadeQuery(int maxNodes) {
    dtNavMeshQuery* navQuery = dtAllocNavMeshQuery();
    navQuery->init(&this->loadednavmesh, maxNodes);
    return navQuery;
}

std::optional<EntVector3> LoadedNavmeshData::GetRandomPointOnNavmesh() {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    const auto navQuery = GetPremadeQuery();

    dtQueryFilter filter;
    // filter.setIncludeFlags(63);
    // filter.setExcludeFlags(0);

    dtPolyRef randomRef;
    float randomPt[3];
    dtStatus status = navQuery->findRandomPoint(&filter, frand, &randomRef, randomPt);

    if (dtStatusSucceed(status)) {
        dtFreeNavMeshQuery(navQuery);
        return EntVector3(randomPt[0], randomPt[1], randomPt[2]);
    } else {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}