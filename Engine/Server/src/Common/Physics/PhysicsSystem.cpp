#include "PhysicsSystem.h"
#include "Entities/Core/EntTransform.h"
#include "Entities/Core/EntVectorUtils.h"
#include "Entities/EntityTaskRunners.hpp"
#include "RigidBody.h"
#include <bullet/btBulletDynamicsCommon.h>

PhysicsSystem* PhysicsSystem::physSystem;

PhysicsSystem::PhysicsSystem() {
    btBroadphaseInterface* broadphase = new btDbvtBroadphase();
    btDefaultCollisionConfiguration* collisionConfiguration = new btDefaultCollisionConfiguration();
    btCollisionDispatcher* dispatcher = new btCollisionDispatcher(collisionConfiguration);
    btSequentialImpulseConstraintSolver* solver = new btSequentialImpulseConstraintSolver;

    dynamicsWorld = new btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    dynamicsWorld->setGravity(btVector3(0, 0, 0));
    physSystem = this;
}

void PhysicsSystem::RebuildRigidBods(bool FirstTime, double deltaTime) {
    //Reset all physics bodies
    EntityTaskRunners::AutoPerformTasksParallel("BuildPhysBods", EntityComponentSystem::GetEntitiesWithData({typeid(RigidBody), typeid(DirtyRigidBody)}, {}), BuildPhysicsBody, deltaTime);
}

void PhysicsSystem::BuildPhysicsBody(double dt, EntityData* ent) {
    EntityComponentSystem::GetComponent<RigidBody>(ent)->RebuildPhysicsBody(ent);
}

void PhysicsSystem::UpdatePhysicsSystem(bool FirstTime, double deltaTime) {
    //Update physics system
    physSystem->dynamicsWorld->stepSimulation(deltaTime, 10, 1.0 / 128.0);
}

void PhysicsSystem::PostPhysicsSystem(bool FirstTime, double deltaTime) {
    //Copy positions across for all physics entities
    EntityTaskRunners::AutoPerformTasksParallel("CopyPhysMove", EntityComponentSystem::GetEntitiesWithData({typeid(RigidBody), typeid(EntTransform)}, {}), CopyPhysicsBody, deltaTime);
}

void PhysicsSystem::CopyPhysicsBody(double dt, EntityData* ent) {
    auto RB = EntityComponentSystem::GetComponent<RigidBody>(ent);
    if (!RB->ItemRigidBody) {
        return;
    }
    auto RBTF = RB->ItemRigidBody->getWorldTransform();
    auto RBVel = RB->ItemRigidBody->getLinearVelocity();
    auto RBPos = RBTF.getOrigin();
    auto RBRot = RBTF.getRotation();
    auto TF = EntityComponentSystem::GetComponent<EntTransform>(ent);
    //Copy changes
    RB->Velocity.X = RBVel.getX();
    RB->Velocity.Y = RBVel.getY();
    RB->Velocity.Z = RBVel.getZ();

    if (EntVectorUtils::Length(RB->Velocity) < 0.01) {
        RB->ItemRigidBody->setLinearVelocity(btVector3(0, 0, 0));
        RB->ItemRigidBody->setActivationState(ISLAND_SLEEPING);
    }

    TF->Position.X = RBPos.getX();
    TF->Position.Y = RBPos.getY();
    TF->Position.Z = RBPos.getZ();

    TF->Rotation.X = RBRot.getX();
    TF->Rotation.Y = RBRot.getY();
    TF->Rotation.Z = RBRot.getZ();
    TF->Rotation.W = RBRot.getW();
    //TODO: Check if change is actually large enough to trigger networking etc!
    EntityComponentSystem::MarkCompToNetwork<EntTransform>(ent, {"Position", "Rotation"});

    //std::cout << TF->Rotation.X << std::endl;
}
