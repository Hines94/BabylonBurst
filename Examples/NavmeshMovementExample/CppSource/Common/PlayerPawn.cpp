#include "PlayerPawn.h"
#include "Engine/Rendering/InstancedRender.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Navigation/LoadedNavmeshData.h"

void PlayerPawn::SetupNewPawn(EntityData* pawn) {
    //TODO: This could also easily be done by loading a premade Prefab
    
    //Add Transform
    const auto newTransform = new EntTransform();
    EntityComponentSystem::AddSetComponentToEntity(pawn,newTransform);

    //Add Renderer
    const auto newRenderer = new InstancedRender();
    newRenderer->ModelData.FilePath = "Meshes/VehicleExamples";
    newRenderer->ModelData.FileName = "GreyboxVehicles.gltf";
    newRenderer->ModelData.MeshName = "LightTank";
    const MaterialSpecifier matSpec;
    newRenderer->MaterialData.push_back(matSpec);
    EntityComponentSystem::AddSetComponentToEntity(pawn,newRenderer);

    //TODO: Add controllable Navigator
    const auto loadedNavmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if(!loadedNavmesh) {
        std::cerr << "Can't setup new Pawn as no navmesh!" << std::endl;
        return;
    }
    const auto randomPoint = loadedNavmesh->GetRandomPointOnNavmesh();
    if(!randomPoint) {
        std::cerr << "No random point found for Player Pawn to spawn into!" <<std::endl;
    } else {
        newTransform->Position.X = randomPoint->X;
        newTransform->Position.Y = randomPoint->Y;
        newTransform->Position.Z = randomPoint->Z;
        std::cout << "Setup pawn at pos: " << newTransform->Position << std::endl;
    }
    
}