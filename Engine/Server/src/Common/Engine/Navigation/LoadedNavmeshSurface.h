#pragma once
#include "Engine/Entities/EntitySystem.h"

//Tag to notify when a mesh has been "built" and is part o fnavmesh
CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
struct LoadedNavmeshSurface : public Component {
    DECLARE_COMPONENT_METHODS(LoadedNavmeshSurface)

    void onComponentRemoved(EntityData* entData);
};
