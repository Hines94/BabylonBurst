#pragma once
#include "Engine/Entities/EntitySystem.h"

using PrefabString = std::string;

//An entity that holds details on a spawned Prefab
struct PrefabInstance : public Component {

    DECLARE_COMPONENT_METHODS(PrefabInstance)

    void onComponentAdded(EntityData* entData) override;

    void onComponentRemoved(EntityData* entData) override;

    //Used to identify the type of prefab to spawn
    CPROPERTY(PrefabString, PrefabUUID, NO_DEFAULT, NET, SAVE)

    //Spawned in current Entities
    CPROPERTY(std::vector<EntityData*>, PrefabEntities, NO_DEFAULT, NET, SAVE, EDREAD)
};