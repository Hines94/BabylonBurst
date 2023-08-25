#include "Aws/AwsManager.h"
#include "Entities/Prefabs/PrefabManager.h"
#include "Physics/PhysicsSystem.h"
#include "Player/PlayerConnectionManager.h"
#include <iostream>

namespace ServerSetup {
    void SetupGame() {
        //Setup AWS
        AwsManager::getInstance();
        //Spawn in all our managers
        EntityComponentSystem::SetupEntitySystem();
        new PlayerConnectionManager();
        //TODO: Load existing entities from file?
        //Setup physics
        new PhysicsSystem();
        //Setup prefabs
        PrefabManager::getInstance().RefreshPrefabs();
        //Spawn in environment etc
    }
} // namespace ServerSetup
