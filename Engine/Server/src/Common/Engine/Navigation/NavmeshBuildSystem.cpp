#include "NavmeshBuildSystem.h"
#include "Engine/Entities/EntitySystem.h"
#include "NavigatableMesh.hpp"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Rendering/ModelLoader.h"
#include "Engine/Navigation/BuiltNavMesh.hpp"

void BuildEntity(double Dt, EntityData* ent) {
    const NavigatableMesh* nm = EntityComponentSystem::GetComponent<NavigatableMesh>(ent);
    const auto model = ModelLoader::getInstance().GetMeshFromFile(nm->AwsPath,nm->MeshName,0);
    if(!model.has_value()) {
        return;
    }
    std::cout << "Model loaded and ready to navmesh" << std::endl;
}

void NavmeshBuildSystem::RunSystem(bool Init, double dt) {
    const auto unbuiltEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableMesh)},{typeid(BuiltNavigatableMesh)});
    EntityTaskRunners::AutoPerformTasksParallel("BuildNavmesh",unbuiltEnts,BuildEntity,dt);
}
