#include "EntTransform.h"
#ifdef PHYSICS
#include "Physics/RigidBody.h"
#endif

void EntTransform::onComponentAdded(EntityData* entData) {
#ifdef PHYSICS
    //Reset rigidbody if we have one
    const auto rb = EntityComponentSystem::GetComponent<RigidBody>(entData);
    if (!rb) {
        return;
    }
    rb->ResetPositionToEntTransform(entData);
#endif
}