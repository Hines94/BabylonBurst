#pragma once

#include "Engine/Utils/PerfTracking.h"
#include "Engine/Utils/Settings.h"
#include "Engine/Utils/ThreadPool.h"
#include "EntitySystem.h"
#include <atomic>
#include <functional>
#include <future>
#include <queue>
#include <string>
#include <vector>

namespace EntityTaskRunners {

#ifdef __EMSCRIPTEN__
    //Entity vector is std we dont need extra method
#else
    template <typename T>
    static void AutoPerformTasksSeries(std::string taskName, EntityVector<T*> jobs, std::function<void(double, T*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();
        for (auto& job : jobs) {
            workerOp(deltaTime, job);
        }

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }
#endif

    static void AutoPerformTasksSeries(std::string taskName, std::shared_ptr<EntityQueryResult> job, std::function<void(double, EntityData*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();
        auto entHolder = job.get()->buckets;
        for (auto& entities : entHolder) {
            for (auto& ent : entities->data) {
                workerOp(deltaTime, ent);
            }
        }

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

    template <typename T>
    static void AutoPerformTasksSeries(std::string taskName, std::vector<T*> jobs, std::function<void(double, T*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();
        for (auto& job : jobs) {
            workerOp(deltaTime, job);
        }

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

    template <typename T>
    static void AutoPerformTasksSeries(std::string taskName, std::vector<T> jobs, std::function<void(double, T)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();
        for (auto& job : jobs) {
            workerOp(deltaTime, job);
        }

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }
}; // namespace EntityTaskRunners