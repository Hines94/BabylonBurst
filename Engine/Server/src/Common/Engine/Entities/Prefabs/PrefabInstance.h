#pragma once
#include "Engine/Entities/EntitySystem.h"

//An entity that holds details on a spawned Prefab
struct PrefabInstance : public Component {

    DECLARE_COMPONENT_METHODS(PrefabInstance)

    void onComponentAdded(EntityData* entData);

    void onComponentRemoved(EntityData* entData);

    CPROPERTY(NET, SAVE)
    std::string PrefabUUID;

    CPROPERTY(NET, SAVE, EDREAD)
    std::vector<EntityData*> PrefabEntities;
};