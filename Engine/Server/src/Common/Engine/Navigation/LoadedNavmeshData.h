#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include "recastnavigation/DetourCrowd.h"
#include "recastnavigation/DetourNavMesh.h"
#include <optional>

class dtNavMeshQuery;

//Saved navmesh data for a specific Navmesh setup. Adding new navmesh elements/changing settings will require rebuild.
CCOMPONENT(NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {

    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    //Data generated from navmesh setup
    CPROPERTY(std::vector<unsigned char>, navmeshData, NO_DEFAULT, NOTYPINGS, SAVE)

    //The params used to generate this nav data
    CPROPERTY(std::vector<ModelSpecifier>, savedSetup, NO_DEFAULT, EDREAD, SAVE)

    dtNavMesh loadedNavmesh;
    dtCrowd loadedCrowd;

    //Helper functions
    bool IsNavmeshValid();
    std::optional<dtPolyRef> FindNearestPoly(EntVector3 Origin, EntVector3 Extents = {200, 400, 200});
    //Anywhere on navmesh
    std::optional<EntVector3> GetRandomPointOnNavmesh();
    //Around the start pos to a max radius
    std::optional<EntVector3> GetRandomPointOnNavmeshInCircle(EntVector3 startPos, float Radius);

    std::optional<EntVector3> RaycastForNavmeshPosition(EntVector3 Origin, EntVector3 Direction, float MaxDistance = 1000);

    dtNavMeshQuery* GetPremadeQuery(int maxNodes = 2048);

    int countWalkablePolygons();
    int countNonWalkablePolygons();

    void onComponentAdded(EntityData* entData) override;

    //Given two points get a path between them (with multiple straight line segments)
    std::optional<std::vector<EntVector3>> GetPathToPosition(EntVector3 Origin, EntVector3 Desination);
};