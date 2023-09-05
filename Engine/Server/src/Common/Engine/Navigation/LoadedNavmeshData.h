#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "recastnavigation/DetourNavMesh.h"
#include <optional>

class dtNavMeshQuery;

//TODO: For now this is not saved - come back and work this out later so we dont rebuild every time!
CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {

    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    std::string navmeshData;
    dtNavMesh loadednavmesh;

    //Helper functions

    //Could be anywhere on the navmesh
    bool IsNavmeshValid();
    std::optional<EntVector3> GetRandomPointOnNavmesh();
    dtNavMeshQuery* GetPremadeQuery(int maxNodes = 2048);

    void onComponentAdded(EntityData* entData) override;
};
