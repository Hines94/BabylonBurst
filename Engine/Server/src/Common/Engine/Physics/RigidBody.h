#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include <bullet/btBulletDynamicsCommon.h>

class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
//Acts as rigdbody base to interact with bullet
struct RigidBody : public Component {
    CPROPERTY(float, Mass, 100.f, NET, SAVE)

    CPROPERTY(EntVector3, Velocity, NO_DEFAULT, SAVE, NOTYPINGS)

    btRigidBody* ItemRigidBody;

    DECLARE_COMPONENT_METHODS(RigidBody)

    void RebuildPhysicsBody(EntityData* entData);

    void ResetPositionToEntTransform(EntityData* entData);

    void onComponentAdded(EntityData* entData) override;

    void onComponentRemoved(EntityData* entData) override;

    //NOTE: After step forces are auto reset, so no need to use this
    void ResetRigidBody();

    void AddLocalTorque(float yaw, float pitch, float roll, bool activate = true);
    //Leave relative pos as blank to apply with no offset
    void AddForce(EntVector3 force, EntVector3 relativePos, bool activate = true);
    //Force along center axis with no torque
    void AddCentralForce(EntVector3 force, bool activate = true);
};

/**DON'T MOVE TO TOP OF THIS FILE! Interferes with treesitter
A simple tag to show that this body requires a rebuild*/
CCOMPONENT(NOTYPINGS, NOSAVE, NONETWORK)
struct DirtyRigidBody : public Component {
    DECLARE_COMPONENT_METHODS(DirtyRigidBody)
};