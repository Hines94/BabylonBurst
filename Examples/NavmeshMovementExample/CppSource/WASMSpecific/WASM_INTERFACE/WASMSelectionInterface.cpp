
#include <emscripten/bind.h>
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include "Engine/Entities/EntitySystem.h"
#include "SelectableComponent.hpp"
#include "ActiveSelectedComponent.hpp"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include <msgpack.hpp>

using namespace emscripten;

void ClearSelectedEntities() {
    const auto allSelected = EntityComponentSystem::GetEntitiesWithData({typeid(ActiveSelectedComponent)},{});
    const auto lambdaFunc = [](double dt, EntityData* ent){
        EntityComponentSystem::DelayedRemoveComponent<ActiveSelectedComponent>(ent);
    };
    EntityTaskRunners::AutoPerformTasksSeries("RemoveSelectedEntities",allSelected,lambdaFunc,0);
    EntityComponentSystem::FlushEntitySystem();
}

std::vector<uint8_t> SelectNearestEntity(EntVector3 origin, EntVector3 direction) {
    //Get all entities with selectable component
    const auto selectables = EntityComponentSystem::GetEntitiesWithData({typeid(SelectableComponent),typeid(EntTransform)},{});
    //TODO: Filter those that are not owned by our player

    //TODO: Get closest entity
    EntityData* closest;

    //Package data to send over
    if(closest.size() == 1) {
        const auto data = EntitySaver::GetSpecificSavePack({closest}, false);
        EntityComponentSystem::AddSetComponentToEntity(closest,new ActiveSelectedComponent());
        return EntitySaver::SBufferToUintVector(data);
    } else {
        return std::vector<uint8_t>();
    }
}


EMSCRIPTEN_BINDINGS(WASMSelectionInterface) {
    function("SelectNearestEntity", &SelectNearestEntity);
}
