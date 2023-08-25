#pragma once

#include "StorageTypes.hpp"
#include "Utils/Settings.h"
#include <condition_variable>
#include <functional>
#include <future>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <vector>

class ThreadPool {
public:
    template <typename T>
    static void parallelRunFallback(EntityVector<T*> data, std::function<void(double, T*)> workerOp, double deltaTime) {

        std::vector<std::future<void>> futures;
        for (int i = 0; i < data.size(); i++) {
            auto promise = std::make_shared<std::promise<void>>();
            auto future = promise->get_future();
            auto& task = data[i];
            GetThreadPool().enqueue([workerOp, deltaTime, task, promise] {
                workerOp(deltaTime, task);
                promise->set_value();
            });
            futures.push_back(std::move(future));
        }

        // Start waiting
        for (auto& future : futures) {
            future.get();
        }
    }

    template <typename T>
    static void parallelRunFallback(std::vector<T*> data, std::function<void(double, T*)> workerOp, double deltaTime) {

        std::vector<std::future<void>> futures;
        for (int i = 0; i < data.size(); i++) {
            auto promise = std::make_shared<std::promise<void>>();
            auto future = promise->get_future();
            auto& task = data[i];
            GetThreadPool().enqueue([workerOp, deltaTime, task, promise] {
                workerOp(deltaTime, task);
                promise->set_value();
            });
            futures.push_back(std::move(future));
        }

        // Start waiting
        for (auto& future : futures) {
            future.get();
        }
    }

    template <typename T>
    static void parallelRunFallback(std::vector<T> data, std::function<void(double, T)> workerOp, double deltaTime) {

        std::vector<std::future<void>> futures;
        for (int i = 0; i < data.size(); i++) {
            auto promise = std::make_shared<std::promise<void>>();
            auto future = promise->get_future();
            auto& task = data[i];
            GetThreadPool().enqueue([workerOp, deltaTime, task, promise] {
                workerOp(deltaTime, task);
                promise->set_value();
            });
            futures.push_back(std::move(future));
        }

        // Start waiting
        for (auto& future : futures) {
            future.get();
        }
    }

    static void testRunParallel(int numberParallel, std::function<void(int)> workerOp) {
        ThreadPool pool(numberParallel);

        std::vector<std::future<void>> futures;
        for (int i = 0; i < numberParallel; i++) {
            auto promise = std::make_shared<std::promise<void>>();
            auto future = promise->get_future();
            pool.enqueue([workerOp, promise, i] {
                workerOp(i);
                promise->set_value();
            });
            futures.push_back(std::move(future));
        }

        // Start waiting
        for (auto& future : futures) {
            future.get();
        }
    }

    static ThreadPool& GetThreadPool() {
        static ThreadPool generalThreadPool(Settings::getInstance().NumWorkers);
        return generalThreadPool;
    }

    ThreadPool(size_t threads) : stop(false) {
        for (size_t i = 0; i < threads; ++i)
            workers.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(this->queue_mutex);
                        this->condition.wait(lock, [this] { return this->stop || !this->tasks.empty(); });
                        if (this->stop && this->tasks.empty())
                            return;
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }
                    task();
                }
            });
    }

    template <class F, class... Args>
    void enqueue(F&& f, Args&&... args) {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            tasks.emplace(std::bind(std::forward<F>(f), std::forward<Args>(args)...));
        }
        condition.notify_one();
    }

    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            stop = true;
        }
        condition.notify_all();
        for (std::thread& worker : workers)
            worker.join();
    }

private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    std::mutex queue_mutex;
    std::condition_variable condition;
    bool stop;
};