#include "BuiltNavMesh.h"
#include "NavmeshBuildSystem.h"

void BuiltNavigatableMesh::onComponentRemoved(EntityData* entData) {
    NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
}