#pragma once
#include "Entities/Core/EntVector3.hpp"
#include "Entities/Core/EntVector4.hpp"
#include "Entities/EntitySystem.h"

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
    CPROPERTY(NET, SAVE)
    EntVector3 Position;
    CPROPERTY(NET, SAVE)
    EntVector4 Rotation;
    CPROPERTY(NET, SAVE)
    EntVector3 Scale;

    EntTransform()
        : Scale{1, 1, 1},
          Rotation{0, 0, 0, 1} {
    }

    DECLARE_COMPONENT_METHODS(EntTransform)

    void onComponentAdded(EntityData* entData);
};
