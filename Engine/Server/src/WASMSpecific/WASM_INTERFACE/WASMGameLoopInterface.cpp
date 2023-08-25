#include "Entities/EntitySystem.h"
#include "GameLoop/GameLoop.h"
#include <emscripten/bind.h>

using namespace emscripten;

void UpdateSingleGameLoop() {
    GameLoop::getInstance().UpdateSingleGameLoop();
}

EMSCRIPTEN_BINDINGS(WASMGameLoopInterface) {
    function("UpdateSingleGameLoop", &UpdateSingleGameLoop);
}
