
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
    float a = rayDir.dot(rayDir);  // This will be 1.0 after normalization.
    float b = 2.0f * oc.dot(rayDir);
    float c = oc.dot(oc) - sphereRadius * sphereRadius;

    float discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        // Ray doesn't intersect the sphere.
        float t = -b / (2.0f * a); 
        EntVector3 closestPoint = (t * rayDir);
        closestPoint = rayFrom + closestPoint;
        closestDistance = EntVectorUtils::Length(closestPoint - sphereCenter) - sphereRadius;
        return false;
    } else {
        // Ray intersects the sphere.
        float t1 = (-b - sqrt(discriminant)) / (2.0f * a);
        float t2 = (-b + sqrt(discriminant)) / (2.0f * a);

        EntVector3 intersectionPoint = (t1 * rayDir);
        intersectionPoint = rayFrom + intersectionPoint;
        closestDistance = EntVectorUtils::Length(intersectionPoint - sphereCenter) - sphereRadius;
        std::cout << "Sphere intersected. Distance: " << closestDistance << std::endl;
        return true;
    }
}

std::vector<uint8_t> SelectNearestEntity(EntVector3 origin, EntVector3 direction) {
    ClearSelectedEntities();
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
        EntityComponentSystem::AddSetComponentToEntity(closest,new ActiveSelectedComponent());
        EntityComponentSystem::FlushEntitySystem();
        return EntitySaver::SBufferToUintVector(data);
    } else {
        return std::vector<uint8_t>();
    }
}


EMSCRIPTEN_BINDINGS(WASMSelectionInterface) {
    function("SelectNearestEntity", &SelectNearestEntity);
}
