#include "LoadedNavmeshData.h"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Navigation/NavigatableEntitySurface.h"
#include "NavmeshBuildSystemDebugMethods.cpp"
#include "recastnavigation/DetourCommon.h"
#include "recastnavigation/DetourMath.h"
#include "recastnavigation/DetourNavMeshQuery.h"
#include <cstdlib>

#ifdef PHYSICS
#include "Engine/Physics/PhysicsUtils.h"
#endif

const float maxAgents = 1000;
const float maxAgentRadius = 30;

float frand() {
    return static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
}

void LoadedNavmeshData::onComponentAdded(EntityData* entData) {
    if (navmeshData.empty()) {
        std::cerr << "Navmesh data is empty" << std::endl;
        return;
    }
    try {
        //Init navmesh
        auto status = loadedNavmesh.init(navmeshData.data(), navmeshData.size(), DT_TILE_FREE_DATA);
        if (!dtStatusSucceed(status)) {
            std::cerr << "Failed to init navmesh with saved data: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " Data length: " << navmeshData.size() << std::endl;
        } else {
            std::cout << "Navmesh loaded succesfully. Num walkable polys: " << countWalkablePolygons() << ". num non walkable: " << countNonWalkablePolygons() << ". Num meshes in: " << savedSetup.size() << std::endl;
        }
        //Init crowd
        auto crowdStatus = loadedCrowd.init(maxAgents, maxAgentRadius, &loadedNavmesh);
        if (!dtStatusSucceed(crowdStatus)) {
            std::cerr << "Failed to init nav crowd: " << NavmeshDebugMethods::GetFailStatusForStatus(crowdStatus) << std::endl;
        }
        std::cerr << "TODO: Init all agents that have not currently been init" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error loading navmesh: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "Error loading navmesh: Unknown Error" << std::endl;
    }
}

bool LoadedNavmeshData::IsNavmeshValid() {
    // Check if there are tiles in the navmesh
    if (this->loadedNavmesh.getMaxTiles() == 0) {
        std::cerr << "Navmesh not valid. 0 max tiles!" << std::endl;
        return false;
    }

    return true;
}

dtNavMeshQuery* LoadedNavmeshData::GetPremadeQuery(int maxNodes) {
    dtNavMeshQuery* navQuery = dtAllocNavMeshQuery();
    navQuery->init(&this->loadedNavmesh, maxNodes);
    return navQuery;
}

std::optional<dtPolyRef> LoadedNavmeshData::FindNearestPoly(EntVector3 Origin, EntVector3 Extents) {
    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);

    dtNavMeshQuery* navQuery = GetPremadeQuery();
    dtPolyRef centerPoly;
    float centerPos[3] = {Origin.X, Origin.Y, Origin.Z};
    float extents[3] = {Extents.X, Extents.Y, Extents.Z};

    dtStatus status = navQuery->findNearestPoly(centerPos, extents, &filter, &centerPoly, nullptr); // Get the polygon for the center position
    if (!dtStatusSucceed(status)) {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get nearest poly." << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
    dtFreeNavMeshQuery(navQuery);
    return centerPoly;
}

std::optional<std::vector<EntVector3>> LoadedNavmeshData::GetPathToPosition(EntVector3 Origin, EntVector3 Destination) {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    //Get nearest poly at start and end
    const auto startPoly = FindNearestPoly(Origin);
    if (!startPoly) {
        return std::nullopt;
    }
    const auto endPoly = FindNearestPoly(Destination);
    if (!endPoly) {
        return std::nullopt;
    }

    //Find the path
    const auto navMeshQuery = GetPremadeQuery();
    dtPolyRef path[256];
    int pathCount;
    float startPos[3] = {Origin.X, Origin.Y, Origin.Z};
    float endPos[3] = {Destination.X, Destination.Y, Destination.Z};
    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);

    const auto pathStatus = navMeshQuery->findPath(startPoly.value(), endPoly.value(), startPos, endPos, &filter, path, &pathCount, 256);
    if (!dtStatusSucceed(pathStatus)) {
        dtFreeNavMeshQuery(navMeshQuery);
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(pathStatus) << " for path find" << std::endl;
        return std::nullopt;
    }

    float straightPath[256 * 3];
    int straightPathCount;
    const auto lineStatus = navMeshQuery->findStraightPath(startPos, endPos, path, pathCount, straightPath, 0, 0, &straightPathCount, 256);
    dtFreeNavMeshQuery(navMeshQuery);
    if (!dtStatusSucceed(lineStatus)) {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(lineStatus) << " for path convert to lines" << std::endl;
        return std::nullopt;
    }

    std::vector<EntVector3> result;
    for (int i = 0; i < straightPathCount; ++i) {
        result.emplace_back(straightPath[i * 3], straightPath[i * 3 + 1], straightPath[i * 3 + 2]);
    }
    return result;
}

std::optional<EntVector3> LoadedNavmeshData::RaycastForNavmeshPosition(EntVector3 Origin, EntVector3 Direction, float MaxDistance) {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }

    //Standard recast method is JUNK. Instead need to check all naviagatable surfaces with raycast.
#ifdef PHYSICS
    const auto allNavSurfaces = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableEntitySurface), typeid(EntTransform)}, {});
    std::vector<RaycastableMeshDetails> meshes;
    for (const auto& e : allNavSurfaces.get()->GetLimitedNumber()) {
        const auto surface = EntityComponentSystem::GetComponent<NavigatableEntitySurface>(e);
        if (!surface->extractedModelData) {
            std::cout << "No model data for mesh!" << std::endl;
            continue;
        }
        RaycastableMeshDetails newMesh;
        newMesh.transform = EntityComponentSystem::GetComponent<EntTransform>(e);
        newMesh.data = surface->extractedModelData;
        meshes.push_back(newMesh);
    }
    if (meshes.size() == 0) {
        return std::nullopt;
    }

    const auto result = PhysicsUtils::RaycastMeshes(meshes, Origin, Direction, MaxDistance);

    return result;
#else
    std::cerr << "Unfortunatly physics is required to raycast for navmesh position as Recast does not support proper raycasting" << std::endl;
    return std::nullopt;
#endif
}

void LoadedNavmeshData::UpdateNavmeshData(bool init, float deltaTime) {
    const auto navmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmesh) {
        return;
    }
    if (!navmesh->IsNavmeshValid()) {
        return;
    }
    dtCrowdAgentDebugInfo crowdAvoid;
    navmesh->loadedCrowd.update(deltaTime, &crowdAvoid);
}

std::optional<EntVector3> LoadedNavmeshData::GetRandomPointOnNavmesh() {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    const auto navQuery = GetPremadeQuery();

    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);
    float randomPt[3] = {0, 0, 0};
    dtPolyRef randomPoly;
    dtStatus status = navQuery->findRandomPoint(&filter, frand, &randomPoly, randomPt);

    if (dtStatusSucceed(status)) {
        dtFreeNavMeshQuery(navQuery);
        return EntVector3(randomPt[0], randomPt[1], randomPt[2]);
    } else {
        std::cerr << "Nav query fail: " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get random point" << std::endl;
        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}

std::optional<EntVector3> LoadedNavmeshData::GetRandomPointOnNavmeshInCircle(EntVector3 startPos, float maxRadius) {
    if (!IsNavmeshValid()) {
        return std::nullopt;
    }
    auto navQuery = GetPremadeQuery();

    dtQueryFilter filter;
    filter.setIncludeFlags(0xFFFF);
    filter.setExcludeFlags(0);

    float centerPos[3] = {startPos.X, startPos.Y, startPos.Z};
    const auto polyRef = FindNearestPoly(startPos);
    if (!polyRef) {
        return std::nullopt;
    }
    dtPolyRef centerPoly = polyRef.value();

    dtPolyRef randomPoly;
    float randomPt[3];
    dtFreeNavMeshQuery(navQuery);
    navQuery = GetPremadeQuery();
    dtStatus status = navQuery->findRandomPointAroundCircle(centerPoly, centerPos, maxRadius, &filter, frand, &randomPoly, randomPt);

    if (dtStatusSucceed(status)) {
        dtFreeNavMeshQuery(navQuery);
        return EntVector3(randomPt[0], randomPt[1], randomPt[2]);
    } else {
        std::cerr << "Nav query failed " << NavmeshDebugMethods::GetFailStatusForStatus(status) << " for get random point" << std::endl;

        if (!this->loadedNavmesh.isValidPolyRef(centerPoly)) {
            std::cout << "Nav query failed from isValidPolyRef on centerPoly" << std::endl;
        }
        if (!dtVisfinite(centerPos)) {
            std::cout << "Nav query failed from center pos" << std::endl;
        }
        if (maxRadius < 0 || !dtMathIsfinite(maxRadius)) {
            std::cout << "Nav query failed from radius!" << std::endl;
        }

        //Is filter fail?
        const dtMeshTile* startTile = 0;
        const dtPoly* startPoly = 0;
        this->loadedNavmesh.getTileAndPolyByRefUnsafe(centerPoly, &startTile, &startPoly);
        if (!filter.passFilter(centerPoly, startTile, startPoly)) {
            std::cout << "Nav query failed from filter! startPoly flags: " << startPoly->flags << std::endl;
        }

        dtFreeNavMeshQuery(navQuery);
        return std::nullopt;
    }
}

int LoadedNavmeshData::countWalkablePolygons() {
    int walkablePolyCount = 0;

    for (int i = 0; i < this->loadedNavmesh.getMaxTiles(); ++i) {
        const dtMeshTile* tile = this->loadedNavmesh.getTileAt(i, 0, 0);
        if (!tile) {
            continue;
        }
        for (int j = 0; j < tile->header->polyCount; ++j) {
            const dtPoly* poly = &tile->polys[j];

            // Check if the polygon is used and walkable
            if (poly->getArea() != RC_NULL_AREA && poly->flags != 0) {
                ++walkablePolyCount;
            }
        }
    }

    return walkablePolyCount;
}

int LoadedNavmeshData::countNonWalkablePolygons() {
    int nonWalkCount = 0;

    for (int i = 0; i < this->loadedNavmesh.getMaxTiles(); ++i) {
        const dtMeshTile* tile = this->loadedNavmesh.getTileAt(i, 0, 0);
        if (!tile) {
            continue;
        }
        for (int j = 0; j < tile->header->polyCount; ++j) {
            const dtPoly* poly = &tile->polys[j];

            // Check if the polygon is used and walkable
            if (poly->getArea() == RC_NULL_AREA || poly->flags == 0) {
                ++nonWalkCount;
            }
        }
    }

    return nonWalkCount;
}