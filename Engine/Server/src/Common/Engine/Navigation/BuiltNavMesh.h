#pragma once
#include "Engine/Entities/EntitySystem.h"

//Tag to notify when a mesh has been "built" and is part o fnavmesh
CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
struct BuiltNavigatableMesh : public Component {
    DECLARE_COMPONENT_METHODS(BuiltNavigatableMesh)

    void onComponentRemoved(EntityData* entData);
};
