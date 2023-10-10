
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Navigation/LoadedNavmeshData.h"
#include <emscripten/bind.h>
#include <msgpack.hpp>

using namespace emscripten;

EntVector3 GetRandomPointOnNavmesh() {
    const auto navmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmesh) {
        return {};
    }
    const auto val = navmesh->GetRandomPointOnNavmesh();
    if (val) {
        return val.value();
    } else {
        return {};
    }
}

EntVector3 GetRandomPointOnNavmeshInRadius(EntVector3 center, float radius) {
    const auto navmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmesh) {
        return {};
    }
    const auto val = navmesh->GetRandomPointOnNavmeshInCircle(center, radius);
    if (val) {
        return val.value();
    } else {
        return {};
    }
}

EntVector3 RaycastForPointOnNavmesh(EntVector3 origin, EntVector3 direction) {
    const auto navmesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!navmesh) {
        return {};
    }
    const auto val = navmesh->RaycastForNavmeshPosition(origin, direction);
    if (val) {
        return val.value();
    } else {
        return {};
    }
}

EMSCRIPTEN_BINDINGS(WASMNavigationInterface) {
    function("GetRandomPointOnNavmesh", &GetRandomPointOnNavmesh);
    function("GetRandomPointOnNavmeshInRadius", &GetRandomPointOnNavmeshInRadius);
    function("RaycastForPointOnNavmesh", &RaycastForPointOnNavmesh);
}
