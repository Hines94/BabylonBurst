#include "Settings.h"
#include <iostream>
#include <thread>

Settings::Settings() {
    unsigned int numCPUs = std::thread::hardware_concurrency();
    NumWorkers = numCPUs - 1;
    NumWorkers = std::min(NumWorkers, size_t(1));
    networkingUpdateFreq = 1.0 / 15.0;
}