#include "RigidBody.h"
#include "CapsuleCollider.hpp"
#include "Entities/Core/EntTransform.hpp"
#include "PhysicsSystem.h"

void RigidBody::onComponentAdded(EntityData* entData) {
    EntityComponentSystem::AddSetComponentToEntity(entData, new DirtyRigidBody());
}

void RigidBody::onComponentRemoved(EntityData* entData) {
    //TODO: Remove rigidbody if destroyed
}

void RigidBody::RebuildPhysicsBody(EntityData* owner) {
    if (ItemRigidBody) {
        //TODO: Remove rigidbody!
        return;
    }
    //Get
    btCollisionShape* collider = nullptr;
    if (EntityComponentSystem::HasComponent<CapsuleCollider>(owner)) {
        auto capCol = EntityComponentSystem::GetComponent<CapsuleCollider>(owner);
        collider = new btCapsuleShape(capCol->Width, capCol->Height);
    }

    //Perform build
    if (collider == nullptr) {
        return;
    }

    //Setup initial position
    auto transform = EntityComponentSystem::GetComponent<EntTransform>(owner);
    btDefaultMotionState* capsuleMotionState = new btDefaultMotionState(btTransform(
        btQuaternion(transform->Rotation.X, transform->Rotation.Y, transform->Rotation.Z, transform->Rotation.W),
        btVector3(transform->Position.X, transform->Position.Y, transform->Position.Z)));
    //Setup mass, inertia etc
    btScalar capsuleMass = Mass;
    btVector3 capsuleInertia(0, 0, 0);
    collider->calculateLocalInertia(capsuleMass, capsuleInertia);
    btRigidBody::btRigidBodyConstructionInfo capsuleRigidBodyCI(capsuleMass, capsuleMotionState, collider, capsuleInertia);
    ItemRigidBody = new btRigidBody(capsuleRigidBodyCI);
    ItemRigidBody->setActivationState(ACTIVE_TAG);
    PhysicsSystem::physSystem->dynamicsWorld->addRigidBody(ItemRigidBody);

    //Remove dirty tag
    EntityComponentSystem::DelayedRemoveComponent<DirtyRigidBody>(owner);
}

void RigidBody::ResetRigidBody() {
    //Reset forces
    ItemRigidBody->clearForces();
}

void RigidBody::AddLocalTorque(float yaw, float pitch, float roll, bool activate) {
    if (!ItemRigidBody) {
        return;
    }
    btVector3 localTorque(pitch, yaw, roll);
    //Transform the torque to the global coordinate system
    btMatrix3x3 rotMatrix = ItemRigidBody->getWorldTransform().getBasis();
    btVector3 globalTorque = rotMatrix * localTorque;
    ItemRigidBody->applyTorque(globalTorque);
    if (activate) {
        ItemRigidBody->activate();
    }
}

void RigidBody::AddCentralForce(EntVector3 force, bool activate) {
    if (!ItemRigidBody) {
        return;
    }
    ItemRigidBody->applyCentralForce(force);
    if (activate) {
        ItemRigidBody->activate();
    }
}

void RigidBody::AddForce(EntVector3 force, EntVector3 relativePos, bool activate) {
    if (!ItemRigidBody) {
        return;
    }
    ItemRigidBody->applyForce(force, relativePos);
    if (activate) {
        ItemRigidBody->activate();
    }
}
