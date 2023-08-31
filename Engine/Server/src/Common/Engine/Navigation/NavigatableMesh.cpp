#include "NavigatableMesh.h"
#include "BuiltNavMesh.h"

void NavigatableMesh::onComponentRemoved(EntityData* entData) {
    if(EntityComponentSystem::HasComponent<BuiltNavigatableMesh>(entData)) {
        EntityComponentSystem::DelayedRemoveComponent<BuiltNavigatableMesh>(entData);
    }
}