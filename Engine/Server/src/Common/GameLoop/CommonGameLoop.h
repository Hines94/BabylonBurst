#include <chrono>
#include <functional>
#include <map>
#include <string>

//If we have been init and delta time
using SystemUpdateOp = std::function<void(bool, double)>;

//Parent game loop that will run all general items. Has hooks for specific points in the loop
class CommonGameLoop {
public:
    //Set the game loop to endlessly run
    virtual void EndlessRunGameLoop();

    //Single update cycle for the game loop (gameplay & physics etc)
    virtual void UpdateSingleGameLoop();

protected:
    // --- Hooks for running child loops ---

    //Run before any physics or other common methods are called - return false to bail out
    virtual bool InitialFrame_Update() = 0;
    //Run after gravity etc applied but before physics is actually run
    virtual void PostPhysicsSetup_PrePhysicsRun_Update() = 0;
    //Run at total end of frame (just prior to DT update)
    virtual void EndOfFrame_Update() = 0;

    // --- End Hooks ---

    //General System updates
    void UpdateSystem(bool systemInit, double deltaTime, SystemUpdateOp op, std::string opName, double rateLimit = -1);
    void UpdateDeltaTime();

    bool systemInit = false;
    double deltaTime = 0.00000000000001;
    const double minDT = double(1.0 / 250);

    std::map<std::string, double> LastRunTimes = std::map<std::string, double>();
    std::chrono::system_clock::time_point priorTime = std::chrono::system_clock::now();
};