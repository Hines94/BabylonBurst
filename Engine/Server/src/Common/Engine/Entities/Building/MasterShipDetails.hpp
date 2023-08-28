#pragma once
#include "Engine/Entities/EntitySystem.h"

//Contains all parts etc for a ship. Easy way to iterate through all parts and get their data
struct MasterShipDetails : public Component {

    CPROPERTY(NET, SAVE)
    std::vector<EntityData*> AllParts;

    DECLARE_COMPONENT_METHODS(MasterShipDetails)
};
