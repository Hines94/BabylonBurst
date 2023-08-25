#include "CommonGameLoop.h"
#include "Entities/Building/BuildingSystem.h"
#include "Entities/Control/ControllableMover.h"
#include "Entities/Control/ControllableRotator.h"
#include "Entities/EntitySystem.h"
#include "Physics/PhysicsSystem.h"
#include "Utils/Environment.h"
#include "Utils/PerfTracking.h"
#include "Utils/Settings.h"
#include <chrono>
#include <iostream>
#include <map>
#include <thread>
#include <typeinfo>

void busyWait(double seconds) {
    auto start = std::chrono::system_clock::now();
    auto duration = std::chrono::duration<double>(seconds);

    while (std::chrono::system_clock::now() - start < duration) {
    }
}

//Use a function to specify a system and update our
void CommonGameLoop::UpdateSystem(bool systemInit, double deltaTime, SystemUpdateOp op, std::string opName, double rateLimit) {
    if (Environment::GetDebugMode() >= DebugMode::Light && rateLimit == 0) {
        std::cout << "Rate limit 0 for " << opName << " could be integer/integer?" << std::endl;
    }
    //Check rate limit
    if (rateLimit > 0) {
        auto& lastRun = LastRunTimes[opName];
        lastRun += deltaTime;
        if (lastRun < rateLimit) {
            return;
        }
        lastRun = 0;
    }

    //Get name and measure perf
    auto StartTime = std::chrono::system_clock::now();

    //Actual update
    op(!systemInit, deltaTime);
    EntityComponentSystem::FlushEntitySystem();

    //Track limit
    auto endTime = std::chrono::system_clock::now();
    auto runTime = std::chrono::duration<double>(endTime - StartTime).count();
    PerfTracking::getInstance().UpdateSystemDeltaTime(opName, runTime);
}

void CommonGameLoop::EndlessRunGameLoop() {
    std::cout << "Starting Game Loop" << std::endl;

    while (true) {
        UpdateSingleGameLoop();
    }
}

void CommonGameLoop::UpdateSingleGameLoop() {
    if (!InitialFrame_Update()) {
        return;
    }

    //Rebuild physics bodies that are dirty
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::RebuildRigidBods, "PhysBuildBods");

    //TODO: Apply gravitaional forces etc

    PostPhysicsSetup_PrePhysicsRun_Update();

    //Buildng system
    UpdateSystem(systemInit, deltaTime, BuildingSystem::UpdateBuildSystem, "BuildSystem");

    //Update Ship Controllers
    UpdateSystem(systemInit, deltaTime, ControllableRotator::UpdateRotationControllers, "ControlRot");
    UpdateSystem(systemInit, deltaTime, ControllableMover::UpdateMovementControllers, "ControlMove");

    //Update physics
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::UpdatePhysicsSystem, "PhysMain");
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::PostPhysicsSystem, "PhysPost");

    EndOfFrame_Update();

    //Calculate delta time and wait at end of tick if required
    UpdateDeltaTime();
}

void CommonGameLoop::UpdateDeltaTime() {
    auto currentTime = std::chrono::system_clock::now();
    auto newDT = std::chrono::duration<double>(currentTime - priorTime).count();
    if (newDT < minDT) {
        const double sleepTime = minDT - newDT;
        busyWait(sleepTime);
    }
    currentTime = std::chrono::system_clock::now();
    deltaTime = std::chrono::duration<double>(currentTime - priorTime).count();
    priorTime = std::chrono::system_clock::now();
    //Set framerate in prometheus
    PerfTracking::getInstance().UpdateDeltaTime(deltaTime);
    systemInit = true;
}
