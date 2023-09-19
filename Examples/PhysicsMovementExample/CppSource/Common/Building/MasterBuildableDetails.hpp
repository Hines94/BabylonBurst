#pragma once
#include "Engine/Entities/EntitySystem.h"

// Contains all parts for a buildable
struct MasterBuildableDetails : public Component {

    CPROPERTY(std::vector<EntityData*>, AllParts, NO_DEFAULT, NET, SAVE)

    DECLARE_COMPONENT_METHODS(MasterBuildableDetails)
};
