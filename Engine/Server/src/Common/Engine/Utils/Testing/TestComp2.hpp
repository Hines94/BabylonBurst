#pragma once
#include "Engine/Entities/EntitySystem.h"
//These have to be compiled into the engine to run our tests unfortunately

CCOMPONENT(NOTYPINGS)
struct TestComp2 : public Component {
public:
    CPROPERTY(std::string, val, NO_DEFAULT, SAVE);

    DECLARE_COMPONENT_METHODS(TestComp2)
};