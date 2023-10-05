#include "Engine/GameLoop/CommonGameLoop.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "PlayerMainSpawner.h"
#include "Engine/Player/PlayerCoreComponent.hpp"
#include "Engine/Entities/EntityTaskRunners.hpp"

void InitUninitPlayer(double DT, EntityData* ent) {
    const auto newSpawner = new PlayerMainSpawner();
    newSpawner->SetupNewPlayer(ent);
    EntityComponentSystem::AddSetComponentToEntity(ent,newSpawner);
}

void TestSystem(bool SystemInit, double deltaTime) {
    if(!SystemInit) {
        std::cout << "Loading Nav Test Map" << std::endl;
        //Load test map in
        const auto map = PrefabManager::getInstance().LoadPrefabByName("Maps/TestMapBundle","TestMapPrefab");
        if(map) {
            std::cout << "Nav test map loaded successfully!" << std::endl;
        } else {
            std::cerr << "Nav test map load failed!" << std::endl;
        }
    }

    //Check if player init
    const auto uninitPlayers = EntityComponentSystem::GetEntitiesWithData({typeid(PlayerCoreComponent)},{typeid(PlayerMainSpawner)});
    EntityTaskRunners::AutoPerformTasksParallel("InitPlayers",uninitPlayers,InitUninitPlayer,deltaTime);
}

REGISTER_MIDDLE_SYSTEM_UPDATE(NavmeshTestSystem,TestSystem,-1)