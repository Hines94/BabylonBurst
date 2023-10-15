#include "PhysicsUtils.h"
#include "bullet/btBulletCollisionCommon.h"
#include <bullet/btBulletDynamicsCommon.h>

struct RayResultCallback : public btCollisionWorld::ClosestRayResultCallback {
    RayResultCallback(const btVector3& rayFromWorld, const btVector3& rayToWorld)
        : btCollisionWorld::ClosestRayResultCallback(rayFromWorld, rayToWorld) {}

    // Override/add callbacks as necessary.
};

std::optional<EntVector3> PhysicsUtils::RaycastMeshes(std::vector<RaycastableMeshDetails> meshesIn, EntVector3 Origin, EntVector3 Direction, float MaxDistance) {
    // Collision configuration contains default setup for memory, collision setup
    btDefaultCollisionConfiguration* collisionConfiguration = new btDefaultCollisionConfiguration();

    // Use the default collision dispatcher. For parallel dispatching, you can use a different dispatcher (see Bullet's documentation).
    btCollisionDispatcher* dispatcher = new btCollisionDispatcher(collisionConfiguration);

    // btDbvtBroadphase is a good general purpose broadphase.
    btBroadphaseInterface* overlappingPairCache = new btDbvtBroadphase();

    // Create the world
    btCollisionWorld* collisionWorld = new btCollisionWorld(dispatcher, overlappingPairCache, collisionConfiguration);

    std::vector<btCollisionObject*> collisionShapes;
    for (const auto& m : meshesIn) {
        if (m.data == nullptr || m.transform == nullptr) {
            continue;
        }
        btCollisionObject* obj = new btCollisionObject();
        const auto data = m.data->GetTriangleMeshShape();
        if (data == nullptr) {
            std::cerr << "null mesh for extracted object!" << std::endl;
            continue;
        }
        obj->setCollisionShape(data);
        collisionWorld->addCollisionObject(obj);
        collisionShapes.push_back(obj);
    }

    btVector3 from(Origin.X, Origin.Y, Origin.Z);
    btVector3 to(Origin.X + Direction.X * MaxDistance, Origin.Y + Direction.Y * MaxDistance, Origin.Z + Direction.Z * MaxDistance);

    RayResultCallback rayCallback(from, to);
    collisionWorld->rayTest(from, to, rayCallback);

    delete collisionWorld;
    delete overlappingPairCache;
    delete dispatcher;
    delete collisionConfiguration;
    for (const auto& cs : collisionShapes) {
        delete cs;
    }

    if (rayCallback.hasHit()) {
        btVector3 hitPoint = rayCallback.m_hitPointWorld;
        // Use the hit point
        return EntVector3{hitPoint.getX(), hitPoint.getY(), hitPoint.getZ()};
    }
    return std::nullopt;
}

std::optional<EntVector3> PhysicsUtils::RaycastSphere(EntVector3 sphereOrigin, float sphereRadius, EntVector3 RayOrigin, EntVector3 RayDirection, float MaxDistance) {
    // Collision configuration contains default setup for memory, collision setup
    btDefaultCollisionConfiguration* collisionConfiguration = new btDefaultCollisionConfiguration();

    // Use the default collision dispatcher. For parallel dispatching, you can use a different dispatcher (see Bullet's documentation).
    btCollisionDispatcher* dispatcher = new btCollisionDispatcher(collisionConfiguration);

    // btDbvtBroadphase is a good general purpose broadphase.
    btBroadphaseInterface* overlappingPairCache = new btDbvtBroadphase();

    // Create the world
    btCollisionWorld* collisionWorld = new btCollisionWorld(dispatcher, overlappingPairCache, collisionConfiguration);

    btCollisionObject* collisionSphere = new btCollisionObject();
    btCollisionShape* sphereShape = new btSphereShape(sphereRadius);
    collisionSphere->setCollisionShape(sphereShape);
    btTransform transform;
    transform.setIdentity();
    btVector3 position(sphereOrigin.X, sphereOrigin.Y, sphereOrigin.Z);
    transform.setOrigin(position);
    collisionSphere->setWorldTransform(transform);
    collisionWorld->addCollisionObject(collisionSphere);

    btVector3 from(RayOrigin.X, RayOrigin.Y, RayOrigin.Z);
    btVector3 to(RayOrigin.X + RayDirection.X * MaxDistance, RayOrigin.Y + RayDirection.Y * MaxDistance, RayOrigin.Z + RayDirection.Z * MaxDistance);

    RayResultCallback rayCallback(from, to);
    collisionWorld->rayTest(from, to, rayCallback);

    delete collisionWorld;
    delete overlappingPairCache;
    delete dispatcher;
    delete collisionConfiguration;
    delete sphereShape;
    delete collisionSphere;

    if (rayCallback.hasHit()) {
        btVector3 hitPoint = rayCallback.m_hitPointWorld;
        // Use the hit point
        return EntVector3{hitPoint.getX(), hitPoint.getY(), hitPoint.getZ()};
    }
    return std::nullopt;
}