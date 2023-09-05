#include "PlayerMainSpawner.h"
#include "PlayerPawn.h"

void PlayerMainSpawner::SetupNewPlayer(EntityData* player) {
    //Spawn in new Entity
    const auto playerPawn = EntityComponentSystem::AddEntity();
    const auto playerPawnComp = new PlayerPawn();
    playerPawnComp->SetupNewPawn(playerPawn);
    EntityComponentSystem::AddSetComponentToEntity(playerPawn,playerPawnComp);

    SpawnedEntity = playerPawn;
}