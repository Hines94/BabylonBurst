#include "LoadedNavmeshSurface.h"
#include "NavmeshBuildSystem.h"

void LoadedNavmeshSurface::onComponentRemoved(EntityData* entData) {
    NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
}