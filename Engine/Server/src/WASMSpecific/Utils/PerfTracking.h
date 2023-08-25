#pragma once
#include "StorageTypes.hpp"
#include <string>

//Fake dummy version for WASM (prometheus not compatible or needed)
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

    void UpdateSystemPerformance(double dt);
    void UpdateDeltaTime(double dt);
    void UpdateDataOut(uint dataSize);

    void IncrementActivePlayers();
    void DecrementActivePlayers();

    void UpdateSystemDeltaTime(std::string systemName, double systemTime);
    void UpdateTaskDeltaTime(std::string taskName, double taskTime);
};