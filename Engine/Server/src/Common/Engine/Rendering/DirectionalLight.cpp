#include "DirectionalLight.h"
#include "LightRebuildTag.hpp"

void DirectionalLight::onComponentAdded(EntityData* entData) {
    EntityComponentSystem::AddSetComponentToEntity(entData, new LightRebuildTag());
}

void DirectionalLight::onComponentChanged(EntityData* entData) {
    EntityComponentSystem::AddSetComponentToEntity(entData, new LightRebuildTag());
}