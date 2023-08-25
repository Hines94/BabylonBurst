#include "Physics/PhysicsSystem.h"
#include <iostream>

namespace WASMSetup {
    void SetupWASM() {
        //Spawn in all our managers
        EntityComponentSystem::SetupEntitySystem();
        //Setup physics
        new PhysicsSystem();
    }
} // namespace WASMSetup
