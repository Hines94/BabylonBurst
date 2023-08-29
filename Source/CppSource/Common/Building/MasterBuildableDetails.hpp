#pragma once
#include "Engine/Entities/EntitySystem.h"

// Contains all parts for a buildable
struct MasterBuildableDetails : public Component {

    CPROPERTY(NET, SAVE)
    std::vector<EntityData*> AllParts;

    DECLARE_COMPONENT_METHODS(MasterBuildableDetails)
};
