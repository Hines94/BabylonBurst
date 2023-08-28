#pragma once
#include "Engine/Utils/Environment.h"
#include "TestBoxPingPong.hpp"
#include "TestCreationDeletion.hpp"
#include <functional>
#include <iostream>

bool updateIfInMode(bool init, std::string modeName, std::function<void(double)> upd, std::function<void()> setup, double dt, bool currentVal) {
    auto testMode = Environment::GetEnvironmentVariable("SFSERVER_TEST_MODE");
    if (testMode == modeName) {
        if (init == false) {
            setup();
        }
        upd(dt);
        return true;
    }
    return currentVal;
}

namespace TestingController {
    bool testingEnabled = false;
    void UpdateTesting(bool FirstTime, double dt) {
        if (FirstTime == false && testingEnabled == false) {
            return;
        }
        //All of our testing senarios below here
        testingEnabled = updateIfInMode(FirstTime, "TestBoxPingPong", TestBoxPingPong::update, TestBoxPingPong::setup, dt, testingEnabled);
        testingEnabled = updateIfInMode(FirstTime, "TestCreationDeletion", TestCreationDeletion::update, TestCreationDeletion::setup, dt, testingEnabled);
    }
} // namespace TestingController