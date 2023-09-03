#pragma once
#include "Engine/Entities/EntitySystem.h"

CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {
    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    std::string navmeshData;
};
