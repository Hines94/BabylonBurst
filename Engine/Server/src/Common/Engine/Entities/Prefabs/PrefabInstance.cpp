#include "PrefabInstance.h"
#include "PrefabManager.h"

void PrefabInstance::onComponentAdded(EntityData* entData) {
    if (!PrefabManager::getInstance().SpawnPrefabComponents(this, entData)) {
        std::cerr << "Prefab Instance added to Entity with bad UUID: " << PrefabUUID << " Please set correct UUID before adding" << std::endl;
    }
}

void PrefabInstance::onComponentRemoved(EntityData* entData) {
    for (const auto& ent : PrefabEntities) {
        EntityComponentSystem::DelayedRemoveEntity(ent);
    }
}
