#pragma once
#include "MasterShipDetails.hpp"

namespace NewShipSetup {
    EntityData* GenerateNewShip() {
        auto newShip = EntityComponentSystem::AddEntity();
        EntityComponentSystem::AddSetComponentToEntity(newShip, new MasterShipDetails());
        std::cout << "New ship generated" << std::endl;

        return newShip;
    }
} // namespace NewShipSetup