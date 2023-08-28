#include "Engine/Aws/AwsManager.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#ifdef PHYSICS
#include "Engine/Physics/PhysicsSystem.h"
#endif
#include "Engine/Player/PlayerConnectionManager.h"
#include "Engine/Player/testRegister.hpp"
#include <iostream>

namespace ServerSetup {
    void SetupGame() {
        //Setup AWS
        AwsManager::getInstance();
        //Spawn in all our managers
        EntityComponentSystem::SetupEntitySystem();
        new PlayerConnectionManager();
        //TODO: Load existing entities from file?
#ifdef PHYSICS
        new PhysicsSystem();
#endif
        //Setup prefabs
        PrefabManager::getInstance().RefreshPrefabs();
        //Spawn in environment etc
        TestRego::testFunc();
    }
} // namespace ServerSetup