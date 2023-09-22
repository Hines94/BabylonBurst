#pragma once
#include "Engine/Entities/EntitySystem.h"
//These have to be compiled into the engine to run our tests unfortunately

CCOMPONENT(NOTYPINGS)
struct TestComp : public Component {
public:
    static int removedNum;
    static int addedNum;
    std::string val;

    void onComponentAdded(EntityData* entData) override {
        addedNum++;
    }

    void onComponentRemoved(EntityData* entData) override {
        removedNum++;
    }

    DECLARE_COMPONENT_METHODS(TestComp)
};