#pragma once
#include "Engine/Entities/EntitySystem.h"

//For now a singleton - but TODO: in future may be different build settings for different types (eg large vehicle vs humanoid) http://digestingduck.blogspot.com/2009/08/recast-settings-uncovered.html
struct NavmeshBuildSetup : public Component {
    DECLARE_COMPONENT_METHODS(NavmeshBuildSetup)

    //Smaller is more granular but takes longer
    CPROPERTY(float, CellSize, 0.2, NET, SAVE)

    //Smaller is more granular but takes longer
    CPROPERTY(float, CellHeight, 0.1, NET, SAVE)

    //Max degrees of walkable slope
    CPROPERTY(float, WalkableSlopeHeight, 45, NET, SAVE)

    //Max height (cell Units) that is considered climbale
    CPROPERTY(float, WalkableClimb, 1, NET, SAVE)

    //Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable
    CPROPERTY(float, WalkableHeight, 2, NET, SAVE)

    //Minimum size in cells allowed to form an island region
    CPROPERTY(float, MinRegionArea, 8, NET, SAVE)

    //Any regions smaller than this will be merged if possible
    CPROPERTY(float, MergeRegionArea, 50, NET, SAVE)

    bool performRebuild = false;

    void onComponentAdded(EntityData* entData) override;

    void onComponentOverwritten(EntityData* entData, Component* newComp) override;

    static bool NavBuildSettingsEqual(NavmeshBuildSetup* settingsA, NavmeshBuildSetup* settingsB);
};