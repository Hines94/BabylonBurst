#include "NavmeshBuildSetup.h"
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"

void NavmeshBuildSetup::onComponentAdded(EntityData* ent) {
    const auto existingBuilds = EntityComponentSystem::GetEntitiesWithData({typeid(NavmeshBuildSetup)}, {});
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

void NavmeshBuildSetup::onComponentOverwritten(EntityData* entData, Component* newComp) {
    const auto newCompNav = static_cast<NavmeshBuildSetup*>(newComp);
    if (NavBuildSettingsEqual(this, newCompNav)) {
        return;
    }
    newCompNav->performRebuild = true;
}

bool NavmeshBuildSetup::NavBuildSettingsEqual(NavmeshBuildSetup* settingsA, NavmeshBuildSetup* settingsB) {
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