#pragma once

#include <atomic>
#include <memory> // For std::shared_ptr
#include <mutex>
#include <prometheus/counter.h>  // For prometheus::Counter
#include <prometheus/exposer.h>  // For prometheus::Exposer
#include <prometheus/registry.h> // For prometheus::Registry
#include <thread>

class PerfTracking {
public:
    PerfTracking();

    ~PerfTracking();

    static PerfTracking& getInstance() {
        static PerfTracking instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    PerfTracking(PerfTracking const&) = delete;
    void operator=(PerfTracking const&) = delete;

    void UpdateDeltaTime(double dt);
    void UpdateDataOut(uint dataSize);

    void IncrementActivePlayers();
    void DecrementActivePlayers();

    void UpdateSystemDeltaTime(std::string systemName, double systemTime);
    void UpdateTaskDeltaTime(std::string taskName, double taskTime);

private:
    std::shared_ptr<prometheus::Registry> promReg;
    prometheus::Exposer exposer;
    prometheus::Counter& uptimeCounter;
    prometheus::Gauge& playerNumber;
    prometheus::Gauge& framerate;
    prometheus::Gauge& dataOut;
    prometheus::Gauge& cpuUseage;
    prometheus::Family<prometheus::Gauge>& systemsGage;
    prometheus::Family<prometheus::Gauge>& tasksGage;
    prometheus::Family<prometheus::Gauge>& memoryGage;

    std::thread MonitoringThread;
    std::atomic<bool> stopThread = false;
    void performanceMonitor();
    void updateMemoryUseage();
};