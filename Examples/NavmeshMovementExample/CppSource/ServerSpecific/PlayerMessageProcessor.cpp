#include "Engine/Player/PlayerMessageProcessor.h"
#include "Engine/Player/PlayerConnectionManager.h"
#include "Engine/Navigation/NavigatableAgent.h"
#include  "Requests/PlayerMovementRequest.hpp"

void processNavEntity(double dt, EntityData* e) {
    std::cout << "Called" << std::endl;
}

namespace  PlayerRequestProcessor
{
    void ProcessMovementRequest(double dt, std::pair<std::string, std::vector<uint8_t>> task) {
        auto playerEnt = PlayerConnectionManager::getInstance().GetPlayerEntity(task.first);
        auto playerData = EntityComponentSystem::GetComponentDataForEntity(playerEnt);

        if(!playerData) {
            return;
        }

        PlayerMovementRequest req;
        req.AutoDeserialize(task.second);

        if(req.targetedEnts.size() == 0){ 
            return;
        }

        //Unpack data
        std::cout << "TODO: Check player can validly move units!" << std::endl;

        EntityTaskRunners::AutoPerformTasksSeries<EntityData>("MoveUnits",req.targetedEnts,[req](double dt, EntityData* ent)->void {
            const auto navItem = EntityComponentSystem::GetComponent<NavigatableAgent>(ent);
            navItem->RequestMoveToTarget(req.movementPos);
            EntityComponentSystem::MarkCompToNetwork<NavigatableAgent>(ent);
        }, 0);
    }
} // namespace  PlayerRequestProcessor



REGISTER_PLAYER_MESSAGE(0, PlayerRequestProcessor::ProcessMovementRequest)