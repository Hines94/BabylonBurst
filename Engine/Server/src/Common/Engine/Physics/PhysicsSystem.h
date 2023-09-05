#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <bullet/btBulletDynamicsCommon.h>

class PhysicsSystem {
public:
    PhysicsSystem();
    static PhysicsSystem* physSystem;
    btDiscreteDynamicsWorld* dynamicsWorld;

    static void RebuildRigidBods(bool SystemInit, double deltaTime);
    static void UpdatePhysicsSystem(bool SystemInit, double deltaTime);
    static void PostPhysicsSystem(bool SystemInit, double deltaTime);

private:
    static void BuildPhysicsBody(double dt, EntityData* ent);
    static void CopyPhysicsBody(double dt, EntityData* ent);
};