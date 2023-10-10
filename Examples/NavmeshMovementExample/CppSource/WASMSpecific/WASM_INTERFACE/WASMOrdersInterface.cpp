#include <emscripten/bind.h>
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "ActiveSelectedComponent.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Navigation/LoadedNavmeshData.h"
#include "Engine/Navigation/NavigatableAgent.h"

using namespace emscripten;

//Inputs are mouse related
void IssueUnitsOrder(EntVector3 origin, EntVector3 direction) {
    const auto loadedNavmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if(!loadedNavmesh) {
        return;
    }
    const auto hitPos = loadedNavmesh->RaycastForNavmeshPosition(origin,direction);
    if(hitPos) {
        std::cout << "Found pos!" << std::endl;
        const auto allSelected = EntityComponentSystem::GetEntitiesWithData({typeid(ActiveSelectedComponent),typeid(EntTransform),typeid(NavigatableAgent)},{});
        //TODO: Issue move order for all selected to SERVER (which will then perform)
        EntityTaskRunners::AutoPerformTasksParallel("MoveUnits",allSelected,[hitPos](double dt, EntityData* ent)->void {
            const auto& transform = EntityComponentSystem::GetComponent<EntTransform>(ent);
            transform->Position.X = hitPos.value().X;
            transform->Position.Y = hitPos.value().Y;
            transform->Position.Z = hitPos.value().Z;
            std::cout << "TODO: Use navigatable agent instead!" << std::endl;
        }, 0);
    } else {
        std::cout << "No pos found :(" << std::endl;
    }
}



EMSCRIPTEN_BINDINGS(WASMOrdersInterface) {
    function("IssueUnitsOrder", &IssueUnitsOrder);
}
