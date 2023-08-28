#include "Environment.h"
#include <fstream>
#include <iostream>
#include <map>
#include <string>

std::map<std::string, std::string> Environment::EnvironmentVariables = {};
DebugMode loadedDebugMode;

DebugMode Environment::GetDebugMode() {
    if (loadedDebugMode == DebugMode::Unloaded) {
        if (EnvironmentVariables["DEBUG_MODE"] == "Light") {
            loadedDebugMode = DebugMode::Light;
        }
        if (EnvironmentVariables["DEBUG_MODE"] == "Heavy") {
            loadedDebugMode = DebugMode::Heavy;
        }
        loadedDebugMode = DebugMode::None;
    }
    return loadedDebugMode;
}

std::string Environment::GetEnvironmentVariable(std::string EnvName) {
    if (EnvironmentVariables.count(EnvName) > 0) {
        return EnvironmentVariables[EnvName];
    }
    return "";
}

bool Environment::GetEnvironmentVariableAsBool(std::string EnvName) {
    if (EnvironmentVariables.count(EnvName) > 0) {
        return EnvironmentVariables[EnvName] == "TRUE";
    }
    return "";
}

bool fileExists(const std::string& filePath) {
    std::ifstream file(filePath);
    return file.good();
}

void Environment::LoadEnvironmentVariables() {
    const std::string envFileName = ".env";
    if (fileExists(envFileName) == false) {
        return;
    }

    std::map<std::string, std::string> env;
    std::ifstream file(envFileName);
    std::string line;

    while (std::getline(file, line)) {
        auto delimiterPos = line.find("=");
        auto name = line.substr(0, delimiterPos);
        auto value = line.substr(delimiterPos + 1);

        // Store the environment variable in a map
        env[name] = value;
    }
    Environment::EnvironmentVariables = env;

    std::cout << "Environment vars loaded from file" << std::endl;
}