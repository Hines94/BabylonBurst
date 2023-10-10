#include "CommonGameLoop.h"
#include "Engine/Entities/EntitySystem.h"
#ifdef PHYSICS
#include "Engine/Physics/Control/ControllableMover.h"
#include "Engine/Physics/Control/ControllableRotator.h"
#include "Engine/Physics/PhysicsSystem.h"
#endif
#include "Engine/Navigation/NavigatableAgent.h"
#include "Engine/Navigation/NavmeshBuildSystem.h"
#include "Engine/Utils/Environment.h"
#include "Engine/Utils/PerfTracking.h"
#include "Engine/Utils/Settings.h"
#include <chrono>
#include <iostream>
#include <map>
#include <thread>
#include <typeinfo>

std::vector<SystemUpdateParams> CommonGameLoop::registeredInitialFrameUpdates;
std::vector<SystemUpdateParams> CommonGameLoop::registeredMiddleFrameUpdates;
std::vector<SystemUpdateParams> CommonGameLoop::registeredEndFrameUpdates;

void busyWait(double seconds) {
    auto start = std::chrono::system_clock::now();
    auto duration = std::chrono::duration<double>(seconds);

    while (std::chrono::system_clock::now() - start < duration) {
    }
}

void CommonGameLoop::UpdateSystem(bool systemInit, double deltaTime, SystemUpdateOp op, std::string opName, double rateLimit) {
    if (Environment::GetDebugMode() >= DebugMode::Light && rateLimit == 0) {
        std::cout << "Rate limit 0 for " << opName << " could be integer/integer?" << std::endl;
    }

    if (rateLimit > 0) {
        auto& lastRun = LastRunTimes[opName];
        lastRun += deltaTime;
        if (lastRun < rateLimit) {
            return;
        }
        lastRun = 0;
    }
    auto StartTime = std::chrono::system_clock::now();

    op(systemInit, deltaTime);
    EntityComponentSystem::FlushEntitySystem();

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
    for (const auto& sys : registeredInitialFrameUpdates) {
        UpdateSystem(systemInit, deltaTime, sys.systemFunction, sys.systemName, sys.systemRateLimit);
    }

    UpdateSystem(systemInit, deltaTime, NavmeshBuildSystem::RunSystem, "NavmeshBuild");

#ifdef PHYSICS
    // Rebuild physics bodies that are dirty
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::RebuildRigidBods, "PhysBuildBods");
    // TODO: Apply gravitaional forces etc
#endif

    PostPhysicsSetup_PrePhysicsRun_Update();

    for (const auto& sys : registeredMiddleFrameUpdates) {
        UpdateSystem(systemInit, deltaTime, sys.systemFunction, sys.systemName, sys.systemRateLimit);
    }

#ifdef PHYSICS
    // Update Physics Controllers
    UpdateSystem(systemInit, deltaTime, ControllableRotator::UpdateRotationControllers, "ControlRot");
    UpdateSystem(systemInit, deltaTime, ControllableMover::UpdateMovementControllers, "ControlMove");

    // Update physics
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::UpdatePhysicsSystem, "PhysMain");
    UpdateSystem(systemInit, deltaTime, PhysicsSystem::PostPhysicsSystem, "PhysPost");
#endif

    UpdateSystem(systemInit, deltaTime, NavigatableAgent::UpdateNavAgents, "NavmeshAgents");

    EndOfFrame_Update();

    for (const auto& sys : registeredEndFrameUpdates) {
        UpdateSystem(systemInit, deltaTime, sys.systemFunction, sys.systemName, sys.systemRateLimit);
    }

    //This means that we must run any looking for changes after potential changes, but is easy and simple
    EntityComponentSystem::ResetChangedEntities();

    // Calculate delta time and wait
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
    // Set framerate
    PerfTracking::getInstance().UpdateDeltaTime(deltaTime);
    systemInit = true;
}
