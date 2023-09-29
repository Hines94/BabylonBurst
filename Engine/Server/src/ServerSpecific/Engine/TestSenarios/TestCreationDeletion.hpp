#pragma once
#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/InstancedRender.hpp"
#include <iostream>

namespace TestCreationDeletion {
    float timeSinceUpdate;
    EntityData* SpawnedEnt;

    void setup() {
    }

    void update(double dt) {
        timeSinceUpdate += dt;
        if (timeSinceUpdate < 2) {
            return;
        }
        timeSinceUpdate = 0;

        if (!SpawnedEnt) {
            SpawnedEnt = EntityComponentSystem::AddEntity();
            auto boxVisual = new InstancedRender();
            boxVisual->ModelData.FilePath = "debug/TestBox";
            boxVisual->ModelData.MeshName = "TestBox";
            EntityComponentSystem::AddSetComponentToEntity(SpawnedEnt, boxVisual);
            auto transform = new EntTransform();
            transform->Position.Z = 5;
            EntityComponentSystem::AddSetComponentToEntity(SpawnedEnt, transform);
            std::cout << "CREATE" << std::endl;
        } else {
            //Test deletion?
            //EntityComponentSystem::DelayedRemoveEntity(SpawnedEnt);
            //Test comp removal?
            EntityComponentSystem::DelayedRemoveComponent<InstancedRender>(SpawnedEnt);
            SpawnedEnt = nullptr;
            std::cout << "DELETE" << std::endl;
        }
    }
} // namespace TestCreationDeletion