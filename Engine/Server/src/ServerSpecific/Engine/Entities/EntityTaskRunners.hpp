#pragma once
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"

//Extend the series task runners to use TBB for parallelism

namespace EntityTaskRunners {
    template <typename T>
    static void AutoPerformTasksParallel(std::string taskName, std::vector<T> jobs, std::function<void(double, T)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();

        size_t numJobs = jobs.size();
        if (numJobs == 0) {
            return;
        }

        EntityComponentSystem::SetParallelMode(true);

        //Run our jobs in parallel
        ThreadPool::parallelRunFallback(jobs, workerOp, deltaTime);

        EntityComponentSystem::SetParallelMode(false);

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

    template <typename T>
    static void AutoPerformTasksParallel(std::string taskName, std::vector<T*> jobs, std::function<void(double, T*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();

        size_t numJobs = jobs.size();
        if (numJobs == 0) {
            return;
        }

        EntityComponentSystem::SetParallelMode(true);

        //Run our jobs in parallel
        ThreadPool::parallelRunFallback(jobs, workerOp, deltaTime);

        EntityComponentSystem::SetParallelMode(false);

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

    //Solid in most situations
    template <typename T>
    static void AutoPerformTasksParallel(std::string taskName, EntityVector<T*> jobs, std::function<void(double, T*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();

        size_t numJobs = jobs.size();
        if (numJobs == 0) {
            return;
        }

        EntityComponentSystem::SetParallelMode(true);

        //Run our jobs in parallel
        ThreadPool::parallelRunFallback(jobs, workerOp, deltaTime);

        EntityComponentSystem::SetParallelMode(false);

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

    static void AutoPerformTasksParallel(std::string taskName, std::shared_ptr<EntityQueryResult> job, std::function<void(double, EntityData*)> workerOp, double deltaTime) {
        auto startTime = std::chrono::system_clock::now();

        auto jobs = job.get();
        size_t numJobs = jobs->buckets.size();
        if (numJobs == 0) {
            return;
        }

        EntityComponentSystem::SetParallelMode(true);

        //Queue up our jobs
        for (auto& entities : jobs->buckets) {
            ThreadPool::parallelRunFallback(entities->data, workerOp, deltaTime);
        }

        EntityComponentSystem::SetParallelMode(false);

        //Record performance for prometheus
        auto endTime = std::chrono::system_clock::now();
        auto runTime = std::chrono::duration<double>(endTime - startTime).count();
        PerfTracking::getInstance().UpdateTaskDeltaTime(taskName, runTime);
    }

} // namespace EntityTaskRunners
