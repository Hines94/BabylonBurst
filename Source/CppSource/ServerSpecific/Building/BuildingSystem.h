#pragma once
#include "Building/BuildableObject.h"
#include <string>
#include <unordered_map>

namespace BuildingSystem {
    void UpdateBuildSystem(bool FirstTime, double dt);

    static std::unordered_map<std::string, BuildableObject*> Buildables;

    BuildableObject* GetBuildableObject(const std::string& name);
} // namespace BuildingSystem
  // BuildingSystem
