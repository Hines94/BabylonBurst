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

    //Data generated from navmesh setup
    CPROPERTY(std::string, navmeshData, NO_DEFAULT, NOTYPINGS, SAVE)

    //The params used to generate this nav data
    CPROPERTY(std::vector<ModelSpecifier>, savedSetup, NO_DEFAULT, NOTYPINGS, SAVE)

    dtNavMesh loadednavmesh;

    //Helper functions
    bool IsNavmeshValid();
    std::optional<EntVector3> GetRandomPointOnNavmesh();
    dtNavMeshQuery* GetPremadeQuery(int maxNodes = 2048);

    void onComponentAdded(EntityData* entData) override;
};