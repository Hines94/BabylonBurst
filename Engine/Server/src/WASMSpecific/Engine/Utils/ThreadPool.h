#pragma once

#include "Engine/StorageTypes.hpp"
#include <condition_variable>
#include <functional>
#include <vector>

//In WASM we can't use threads - so all these methods are dummied up
class ThreadPool {
public:
    template <typename T>
    static void parallelRunFallback(std::vector<T*> data, std::function<void(double, T*)> workerOp, double deltaTime) {
        for (auto d : data) {
            workerOp(deltaTime, d);
        }
    }

    template <typename T>
    static void parallelRunFallback(std::vector<T> data, std::function<void(double, T)> workerOp, double deltaTime) {
        for (auto& d : data) {
            workerOp(deltaTime, d);
        }
    }

    static void testRunParallel(int numberParallel, std::function<void(int)> workerOp) {
        for (int i = 0; i < numberParallel; i++) {
            workerOp(i);
        }
    }

    static ThreadPool& GetThreadPool() {
        static ThreadPool generalThreadPool(1);
        return generalThreadPool;
    }

    ThreadPool(size_t threads) {
        //Do nothing here
    }
};