#include "NavmeshBuildSettings.h"
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"

void NavmeshBuildSettings::onComponentAdded(EntityData* ent) {
    const auto existingBuilds = EntityComponentSystem::GetEntitiesWithData({typeid(NavmeshBuildSettings)}, {});
    if (existingBuilds.get()->size() > 0) {
        EntityTaskRunners::AutoPerformTasksSeries(
            "SingeltonNavSettings", existingBuilds, [&](double Dt, EntityData* existing) {
                if (ent != existing) {
                    std::cerr << "NavBuild settings added with existing!" << std::endl;
                }
            },
            0);
    }
}

void NavmeshBuildSettings::onComponentOverwritten(EntityData* entData, Component* newComp) {
    const auto newCompNav = static_cast<NavmeshBuildSettings*>(newComp);
    if (NavBuildSettingsEqual(this, newCompNav)) {
        return;
    }
    newCompNav->performRebuild = true;
}

bool NavmeshBuildSettings::NavBuildSettingsEqual(NavmeshBuildSettings* settingsA, NavmeshBuildSettings* settingsB) {
    if (settingsA->CellHeight != settingsB->CellHeight) {
        return false;
    }
    if (settingsA->CellSize != settingsB->CellSize) {
        return false;
    }
    if (settingsA->MergeRegionArea != settingsB->MergeRegionArea) {
        return false;
    }
    if (settingsA->MinRegionArea != settingsB->MinRegionArea) {
        return false;
    }
    if (settingsA->WalkableClimb != settingsB->WalkableClimb) {
        return false;
    }
    if (settingsA->WalkableHeight != settingsB->WalkableHeight) {
        return false;
    }
    if (settingsA->WalkableSlopeHeight != settingsB->WalkableSlopeHeight) {
        return false;
    }
    return true;
}