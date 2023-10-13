#pragma once
#include <cstddef>

class Settings {
public:
    Settings();

    static Settings& getInstance() {
        static Settings instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    Settings(Settings const&) = delete;
    void operator=(Settings const&) = delete;

    size_t NumWorkers = 6;
    double networkingUpdateFreq;
};