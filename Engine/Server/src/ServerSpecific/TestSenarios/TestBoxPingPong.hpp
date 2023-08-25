#pragma once
#include "Entities/Core/EntTransform.hpp"
#include "Entities/EntitySystem.h"
#include "Networking/ClientLerpTransform.hpp"
#include "Rendering/InstancedRender.hpp"

namespace TestBoxPingPong {
    EntityData* BoxData;
    bool ping = false;

    void setup() {
        //Spawn
        BoxData = EntityComponentSystem::AddEntity();
        auto boxVisual = new InstancedRender();
        boxVisual->AwsPath = "debug/TestBox";
        boxVisual->MeshName = "TestBox";
        EntityComponentSystem::AddSetComponentToEntity(BoxData, boxVisual);
        auto transform = new EntTransform();
        transform->Position.Z = 5;
        EntityComponentSystem::AddSetComponentToEntity(BoxData, transform);
        EntityComponentSystem::AddSetComponentToEntity(BoxData, new ClientLerpTransform());
    }

    void update(double dt) {
        auto transform = EntityComponentSystem::GetComponent<EntTransform>(BoxData);
        if (ping) {
            transform->Position.X += dt * 1;
            if (transform->Position.X > 5) {
                ping = false;
            }
        } else {
            transform->Position.X += dt * -1;
            if (transform->Position.X < -5) {
                ping = true;
            }
        }
        EntityComponentSystem::MarkCompToNetwork<EntTransform>(BoxData);
    }
} // namespace TestBoxPingPong