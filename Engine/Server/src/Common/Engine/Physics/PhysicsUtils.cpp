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