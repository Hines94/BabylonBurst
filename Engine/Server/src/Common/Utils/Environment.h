#pragma once
#include <map>
#include <string>

enum DebugMode {
    Unloaded,
    None,
    Light,
    Heavy
};

namespace Environment {
    //Load in our environment variables and store them in a map
    void LoadEnvironmentVariables();

    std::string GetEnvironmentVariable(std::string EnvName);
    bool GetEnvironmentVariableAsBool(std::string EnvName);

    DebugMode GetDebugMode();

    extern std::map<std::string, std::string> EnvironmentVariables;
} // namespace Environment