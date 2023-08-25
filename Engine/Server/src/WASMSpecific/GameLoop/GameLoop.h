#include "GameLoop/CommonGameLoop.h"

class GameLoop : public CommonGameLoop {

public:
    // Delete the copy constructor and copy assignment operator
    GameLoop(const GameLoop&) = delete;
    GameLoop& operator=(const GameLoop&) = delete;

    // Static method to get the instance of the class
    static GameLoop& getInstance() {
        static GameLoop instance;
        return instance;
    }

protected:
    //Run before any physics or other common methods are called
    bool InitialFrame_Update() override;
    //Run after gravity etc applied but before physics is actually run
    void PostPhysicsSetup_PrePhysicsRun_Update() override;
    //Run at total end of frame (just prior to DT update)
    void EndOfFrame_Update() override;

private:
    GameLoop() {}
};