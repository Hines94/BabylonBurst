#pragma once
#include "Entities/EntitySeriesTaskRunners.hpp"
#include "StorageTypes.hpp"

//In WASM we simply use series as no TBB or parallelism

namespace EntityTaskRunners {
    template <typename T>
    static void AutoPerformTasksParallel(std::string taskName, std::vector<T> jobs, std::function<void(double, T)> workerOp, double deltaTime) {
        AutoPerformTasksSeries(taskName, jobs, workerOp, deltaTime);
    }

    template <typename T>
    static void AutoPerformTasksParallel(std::string taskName, std::vector<T*> jobs, std::function<void(double, T*)> workerOp, double deltaTime) {
        AutoPerformTasksSeries(taskName, jobs, workerOp, deltaTime);
    }

    static void AutoPerformTasksParallel(std::string taskName, std::shared_ptr<EntityQueryResult> job, std::function<void(double, EntityData*)> workerOp, double deltaTime) {
        AutoPerformTasksSeries(taskName, job, workerOp, deltaTime);
    }

} // namespace EntityTaskRunners
