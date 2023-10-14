
#include <emscripten/bind.h>
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/Core/EntVectorUtils.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include "Engine/Entities/EntitySystem.h"
#include "SelectableComponent.hpp"
#include "ActiveSelectedComponent.hpp"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include <msgpack.hpp>
#include <limits>

using namespace emscripten;

void ClearSelectedEntities() {
    const auto allSelected = EntityComponentSystem::GetEntitiesWithData({typeid(ActiveSelectedComponent)},{});
    const auto lambdaFunc = [](double dt, EntityData* ent){
        EntityComponentSystem::DelayedRemoveComponent<ActiveSelectedComponent>(ent);
    };
    EntityTaskRunners::AutoPerformTasksSeries("RemoveSelectedEntities",allSelected,lambdaFunc,0);
    EntityComponentSystem::FlushEntitySystem();
}

//Check if a sphere is intersected and the closest point to its center
bool raySphereTestClosestDistance(const EntVector3& rayFrom, const EntVector3& rayTo, 
                                  const EntVector3& sphereCenter, float sphereRadius, 
                                  float& closestDistance) {
    EntVector3 rayDir = rayTo - rayFrom;
    rayDir.Normalize();

    EntVector3 oc = rayFrom - sphereCenter;
    float b = oc.dot(rayDir);
    float ocLength2 = oc.dot(oc);

    // Check for ray origin inside the sphere
    if (ocLength2 < sphereRadius * sphereRadius) {
        closestDistance = sqrt(sphereRadius * sphereRadius - ocLength2);
        return true;
    }

    float discriminant = b * b - ocLength2 + sphereRadius * sphereRadius;

    if (discriminant < 0) {
        // Ray doesn't intersect the sphere.
        // Compute closest point on ray to sphere center and its distance
        EntVector3 closestPoint = rayFrom - b * rayDir;
        closestDistance = EntVectorUtils::Length(closestPoint - sphereCenter) - sphereRadius;
        return false;
    } else {
        // Ray intersects the sphere.
        float t = -b - sqrt(discriminant);
        if (t < 0) t = 0;  // clamp to ensure point is on the ray segment
        EntVector3 intersectionPoint = rayFrom + t * rayDir;
        closestDistance = 0;  // since it's on the sphere surface
        return true;
    }
}

std::vector<uint8_t> SelectNearestEntity(EntVector3 origin, EntVector3 direction, bool additionSelect, bool toggleSelect) {
    if(!additionSelect && !toggleSelect) {
        ClearSelectedEntities();
    }
    //Get all entities with selectable component
    const auto selectables = EntityComponentSystem::GetEntitiesWithData({typeid(SelectableComponent),typeid(EntTransform)},{});
    //TODO: Filter those that are not owned by our player
    if(selectables.get()->size() == 0) {
        return std::vector<uint8_t>();
    }

    //Get closest entity
    EntityData* closest = nullptr;
    float closestDistance = std::numeric_limits<float>::max();
    //TODO: "smart" margin that is based on how zoomed out we are
    const float Margin = 5;
    for(const auto& s : selectables.get()->GetLimitedNumber()) {
        float dist = 0;
        const auto& transform = EntityComponentSystem::GetComponent<EntTransform>(s);
        const auto& selectable = EntityComponentSystem::GetComponent<SelectableComponent>(s);
        const float size = selectable->SelectionScale + Margin;
        const EntVector3 center = { transform->Position.X, transform->Position.Y + (size/2), transform->Position.Z };
        const auto rayEnd = origin + (direction*10000);
        if(raySphereTestClosestDistance(origin,rayEnd,center,size,dist) && dist < closestDistance) {
            closest = s;
            closestDistance = dist;
        }
    }

    //Package data to send over
    if(closest != nullptr) {
        const auto data = EntitySaver::GetSpecificSavePack({closest}, false);
        if(toggleSelect && EntityComponentSystem::HasComponent<ActiveSelectedComponent>(closest)) {
            EntityComponentSystem::DelayedRemoveComponent<ActiveSelectedComponent>(closest);
        } else {
            EntityComponentSystem::AddSetComponentToEntity(closest,new ActiveSelectedComponent());
        }
        EntityComponentSystem::FlushEntitySystem();
        return EntitySaver::SBufferToUintVector(data);
    } else {
        return std::vector<uint8_t>();
    }
}


EMSCRIPTEN_BINDINGS(WASMSelectionInterface) {
    function("SelectNearestEntity", &SelectNearestEntity);
}
