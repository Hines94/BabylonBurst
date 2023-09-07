#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ModelSpecifier.hpp"
#include "recastnavigation/DetourNavMesh.h"
#include <optional>

class dtNavMeshQuery;

//Saved navmesh data for a specific Navmesh setup. Adding new navmesh elements/changing settings will require rebuild.
CCOMPONENT(NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {

    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    CPROPERTY(NOTYPINGS, SAVE)
    std::string navmeshData;

    //TODO: Add options saved with in case those change
    CPROPERTY(NOTYPINGS, SAVE)
    std::vector<ModelSpecifier> savedSetup;

    dtNavMesh loadednavmesh;

    //Helper functions

    //Could be anywhere on the navmesh
    bool IsNavmeshValid();
    std::optional<EntVector3> GetRandomPointOnNavmesh();
    dtNavMeshQuery* GetPremadeQuery(int maxNodes = 2048);

    void onComponentAdded(EntityData* entData) override;
};
