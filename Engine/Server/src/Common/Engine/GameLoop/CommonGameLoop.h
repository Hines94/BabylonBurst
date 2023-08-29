#include <chrono>
#include <functional>
#include <iostream>
#include <map>
#include <string>

// init and delta time
using SystemUpdateOp = std::function<void(bool, double)>;

struct SystemUpdateParams {
    std::string systemName;
    double systemRateLimit;
    SystemUpdateOp systemFunction;
};

enum SystemUpdateType { Initial,
                        Middle,
                        EndOfFrame };

// Parent game loop that will run all general items.
class CommonGameLoop {
public:
    virtual void EndlessRunGameLoop();

    virtual void UpdateSingleGameLoop();

protected:

    virtual bool InitialFrame_Update() = 0;

    virtual void PostPhysicsSetup_PrePhysicsRun_Update() = 0;

    virtual void EndOfFrame_Update() = 0;

    void UpdateSystem(bool systemInit, double deltaTime, SystemUpdateOp op, std::string opName, double rateLimit = -1);
    void UpdateDeltaTime();

    bool systemInit = false;
    double deltaTime = 0.00000000000001;
    const double minDT = double(1.0 / 250);

    std::map<std::string, double> LastRunTimes = std::map<std::string, double>();
    std::chrono::system_clock::time_point priorTime = std::chrono::system_clock::now();

public:
    static std::vector<SystemUpdateParams> registeredInitialFrameUpdates;
    static std::vector<SystemUpdateParams> registeredMiddleFrameUpdates;
    static std::vector<SystemUpdateParams> registeredEndFrameUpdates;

    class Registrar {
    public:
        Registrar(SystemUpdateType updateType, std::string systemName, SystemUpdateOp func, double rateLimit) {
            SystemUpdateParams params;
            params.systemFunction = func;
            params.systemName = systemName;
            params.systemRateLimit = rateLimit;

            if (updateType == SystemUpdateType::Initial) {
                CommonGameLoop::registeredInitialFrameUpdates.push_back(params);
                std::cout << "Registered new Initial Frame System: " << systemName << std::endl;
            }
            if (updateType == SystemUpdateType::Middle) {
                CommonGameLoop::registeredMiddleFrameUpdates.push_back(params);
                std::cout << "Registered new Middle Frame System: " << systemName << std::endl;
            }
            if (updateType == SystemUpdateType::EndOfFrame) {
                CommonGameLoop::registeredEndFrameUpdates.push_back(params);
                std::cout << "Registered new End Frame System: " << systemName << std::endl;
            }
        }
    };
};

// Initial system update (start of frame before physics setup)
// Function should be format: std::function<void(bool, double)> (initialized, deltaTime) 
// Rate limit used to limit max runs (eg 0.1 will run 10 times sec). Use -1 for no  limit.
// Run in  the order  they are registered in
#define REGISTER_START_SYSTEM_UPDATE(systemName, func, rateLimit) static CommonGameLoop::Registrar _registrar_initial_##systemName(SystemUpdateType::Initial, #systemName, func, rateLimit);

// Middle update - after physics setup but before run
// Function should be format: std::function<void(bool, double)> (initialized, deltaTime) 
// Rate limit used to limit max runs (eg 0.1 will run 10 times sec). Use -1 for no  limit.
// Run in  the order  they are registered in
#define REGISTER_MIDDLE_SYSTEM_UPDATE(systemName, func, rateLimit) static CommonGameLoop::Registrar _registrar_middle_##systemName(SystemUpdateType::Middle, #systemName, func, rateLimit);

// End system update (After all physics)
// Function should be format: std::function<void(bool, double)> (initialized, deltaTime) 
// Rate limit used to limit max runs (eg 0.1 will run 10 times sec). Use -1 for no  limit.
// Run in  the order  they are registered in
#define REGISTER_END_SYSTEM_UPDATE(systemName, func, rateLimit) static CommonGameLoop::Registrar _registrar_middle_##systemName(SystemUpdateType::EndOfFrame, #systemName, func, rateLimit);
