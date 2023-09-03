#pragma once
#include "Engine/Entities/EntitySystem.h"

//For now a singleton - but TODO: in future may be different build settings for different types (eg large vehicle vs humanoid) http://digestingduck.blogspot.com/2009/08/recast-settings-uncovered.html
struct NavmeshBuildSettings : public Component {
    DECLARE_COMPONENT_METHODS(NavmeshBuildSettings)

    CPROPERTY(NET, SAVE)
    //Smaller is more granular but takes longer
    float CellSize = 0.2;

    CPROPERTY(NET, SAVE)
    //Smaller is more granular but takes longer
    float CellHeight = 0.1;

    CPROPERTY(NET, SAVE)
    //Max degrees of walkable slope
    float WalkableSlopeHeight = 45;

    CPROPERTY(NET, SAVE)
    //Max height (cell Units) that is considered climbale
    float WalkableClimb = 1;

    CPROPERTY(NET, SAVE)
    //Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable
    float WalkableHeight = 2;

    CPROPERTY(NET, SAVE)
    //Minimum size in cells allowed to form an island region
    float MinRegionArea = 8;

    CPROPERTY(NET, SAVE)
    //Any regions smaller than this will be merged if possible
    float MergeRegionArea = 50;

    bool performRebuild = false;

    void onComponentAdded(EntityData* entData);

    void onComponentOverwritten(EntityData* entData, Component* newComp);

    static bool NavBuildSettingsEqual(NavmeshBuildSettings* settingsA, NavmeshBuildSettings* settingsB);
};
