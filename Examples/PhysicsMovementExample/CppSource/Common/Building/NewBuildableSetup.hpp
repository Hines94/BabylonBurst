#pragma once
#include "MasterBuildableDetails.hpp"

namespace NewBuildableSetup {
    EntityData* GenerateNewBuildable() {
        auto newBuildable = EntityComponentSystem::AddEntity();
        EntityComponentSystem::AddSetComponentToEntity(newBuildable, new MasterBuildableDetails());
        std::cout << "New building generated" << std::endl;

        return newBuildable;
    }
} // namespace NewBuildableSetup
  // NewBuildableSetup