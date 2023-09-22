#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/Core/EntVector4.hpp"
#include "Engine/Entities/EntitySystem.h"

// Movement Axis that we can apply our forces to
enum DirectionAxis {
    ForwardAxis,
    BackwardAxis,
    RightAxis,
    LeftAxis,
    UpAxis,
    DownAxis
};

enum RotationAxis {
    YawAxis,
    PitchAxis,
    RollAxis
};

// Generic transform struct which can be added to any component
struct EntTransform : public Component {
    //Spatial position
    CPROPERTY(EntVector3, Position, NO_DEFAULT, NET, SAVE)
    //Spatial quaternion
    CPROPERTY(EntVector4, Rotation, NO_DEFAULT, NET, SAVE)
    //Spatial 3d scaling
    CPROPERTY(EntVector3, Scale, NO_DEFAULT, NET, SAVE)

    // EntTransform()
    //     : Scale{1, 1, 1},
    //       Rotation{0, 0, 0, 1} {
    // }

    DECLARE_COMPONENT_METHODS(EntTransform)

    void onComponentAdded(EntityData* entData) override;
};