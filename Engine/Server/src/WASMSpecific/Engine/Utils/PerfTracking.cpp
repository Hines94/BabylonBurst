#include "PerfTracking.h"

//Emscripten version - empty methods
PerfTracking::PerfTracking() {
}

PerfTracking::~PerfTracking() {
}

void PerfTracking::UpdateDeltaTime(double dt) {
}

void PerfTracking::UpdateDataOut(uint dataSize) {
}

void PerfTracking::IncrementActivePlayers() {
}

void PerfTracking::DecrementActivePlayers() {
}

void PerfTracking::UpdateSystemDeltaTime(std::string systemName, double systemTime) {
}

void PerfTracking::UpdateTaskDeltaTime(std::string taskName, double taskTime) {
}
