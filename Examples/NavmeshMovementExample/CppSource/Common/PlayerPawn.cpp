#include "PlayerPawn.h"
#include "Engine/Rendering/InstancedRender.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Navigation/LoadedNavmeshData.h"
#include "Engine/Navigation/NavigatableAgent.h"
#include "SelectableComponent.hpp"

void PlayerPawn::SetupNewPawn(EntityData* pawn) {
    //TODO: This could also easily be done by loading a premade Prefab
    
    //Add Transform
    const auto newTransform = new EntTransform();

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
    
    //Create pawn
    EntityComponentSystem::AddSetComponentToEntity(pawn,newTransform);
    const auto newRenderer = new InstancedRender();
    newRenderer->ModelData.FilePath = "Meshes/VehicleExamples";
    newRenderer->ModelData.FileName = "GreyboxVehicles.gltf";
    newRenderer->ModelData.MeshName = "LightTank";
    const MaterialSpecifier matSpec;
    newRenderer->MaterialData.push_back(matSpec);
    EntityComponentSystem::AddSetComponentToEntity(pawn,newRenderer);
    const auto selectable = new SelectableComponent();
    selectable->SelectionScale = 10;
    EntityComponentSystem::AddSetComponentToEntity(pawn, selectable);
    const auto navAgent = new NavigatableAgent();
    navAgent->maxSpeed = 12;
    navAgent->radius = selectable->SelectionScale/2;
    EntityComponentSystem::AddSetComponentToEntity(pawn,navAgent);
}