#include "NavigatableEntitySurface.h"
#include "LoadedNavmeshSurface.h"

void NavigatableEntitySurface::onComponentRemoved(EntityData* entData) {
    if (EntityComponentSystem::HasComponent<LoadedNavmeshSurface>(entData)) {
        EntityComponentSystem::DelayedRemoveComponent<LoadedNavmeshSurface>(entData);
    }
}

void NavigatableEntitySurface::onComponentAdded(EntityData* entData) {
    if (EntityComponentSystem::HasComponent<LoadedNavmeshSurface>(entData)) {
        EntityComponentSystem::DelayedRemoveComponent<LoadedNavmeshSurface>(entData);
    }
}