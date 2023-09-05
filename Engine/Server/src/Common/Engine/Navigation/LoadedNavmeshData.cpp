#include "LoadedNavmeshData.h"
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
        std::cerr << "Failed to init navmesh with saved data!" << std::endl;
    } else {
        std::cout << "Navmesh loaded from saved data" << std::endl;
    }
}

bool LoadedNavmeshData::IsNavmeshValid() {
    // Check if there are tiles in the navmesh
    if (this->loadednavmesh.getMaxTiles() == 0) {
        return false;
    }

    return true;
}

std::string GetFailStatusForQuery(dtStatus queryStatus) {
    std::string errorMessage;

    if (queryStatus & DT_WRONG_MAGIC) {
        errorMessage += "Invalid Input; ";
    }
    if (queryStatus & DT_WRONG_VERSION) {
        errorMessage += "Wrong Version; ";
    }
    if (queryStatus & DT_OUT_OF_MEMORY) {
        errorMessage += "Out of Memory; ";
    }
    if (queryStatus & DT_INVALID_PARAM) {
        errorMessage += "Invalid Parameter; ";
    }
    if (queryStatus & DT_BUFFER_TOO_SMALL) {
        errorMessage += "Buffer Too Small; ";
    }
    if (queryStatus & DT_OUT_OF_NODES) {
        errorMessage += "Out of Nodes During Search; ";
    }
    if (queryStatus & DT_PARTIAL_RESULT) {
        errorMessage += "Partial Result; ";
    }
    if (queryStatus & DT_ALREADY_OCCUPIED) {
        errorMessage += "Tile Already Occupied; ";
    }

    // If no messages were appended, set a default message.
    if (errorMessage.empty()) {
        errorMessage = "Unknown Error";
    } else {
        // Remove the last two characters "; " from the string to clean it up
        errorMessage = errorMessage.substr(0, errorMessage.length() - 2);
    }

    return errorMessage;
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
        std::cerr << "Nav query fail: " << GetFailStatusForQuery(status) << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}