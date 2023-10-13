#include <emscripten/bind.h>
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "ActiveSelectedComponent.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Navigation/LoadedNavmeshData.h"
#include "Engine/Navigation/NavigatableAgent.h"
#include "Requests/PlayerMovementRequest.hpp"
#include "Engine/Player/PlayerMessageSender.h"

using namespace emscripten;

//Inputs are mouse related
void IssueUnitsOrder(EntVector3 origin, EntVector3 direction) {
    const auto loadedNavmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if(!loadedNavmesh) {
        return;
    }
    const auto hitPos = loadedNavmesh->RaycastForNavmeshPosition(origin,direction);
    if(hitPos) {
        const auto allSelected = EntityComponentSystem::GetEntitiesWithData({typeid(ActiveSelectedComponent),typeid(NavigatableAgent)},{});
        PlayerMovementRequest req;
        req.targetedEnts = allSelected.get()->GetLimitedNumber();
        if(req.targetedEnts.size() == 0) {
            return;
        }
        //Send off request to server
        req.movementPos = hitPos.value();
        PlayerMessageSender::SendMessageToServer(0,req.AutoSerialize());
    }
}

EMSCRIPTEN_BINDINGS(WASMOrdersInterface) {
    function("IssueUnitsOrder", &IssueUnitsOrder);
}
