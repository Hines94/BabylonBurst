#pragma once
#include "Entities/EntitySystem.h"
#include <bullet/btBulletDynamicsCommon.h>

class PhysicsSystem {
public:
    PhysicsSystem();
    static PhysicsSystem* physSystem;
    btDiscreteDynamicsWorld* dynamicsWorld;

    static void RebuildRigidBods(bool FirstTime, double deltaTime);
    static void UpdatePhysicsSystem(bool FirstTime, double deltaTime);
    static void PostPhysicsSystem(bool FirstTime, double deltaTime);

private:
    static void BuildPhysicsBody(double dt, EntityData* ent);
    static void CopyPhysicsBody(double dt, EntityData* ent);
};