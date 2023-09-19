#pragma once
#include "Engine/Entities/EntitySystem.h"

//Generic Bullet capsule collider
struct CapsuleCollider : public Component {
    //Height at max of capsule
    CPROPERTY(float, Height, 1.6, NET, SAVE)

    //Width of capsule
    CPROPERTY(float, Width, 0.5, NET, SAVE)

    DECLARE_COMPONENT_METHODS(CapsuleCollider)
};