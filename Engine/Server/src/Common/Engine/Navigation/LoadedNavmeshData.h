#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "recastnavigation/DetourNavMesh.h"

//TODO: For now this is not saved - come back and work this out later so we dont rebuild every time!
CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {

    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    std::string navmeshData;
    dtNavMesh loadednavmesh;

    void onComponentAdded(EntityData* entData) override;
};
