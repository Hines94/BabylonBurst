#ifdef PHYSICS
#include "Physics/PhysicsSystem.h"
#endif
#include "Entities/EntitySystem.h"
#include <iostream>

namespace WASMSetup {
    void SetupWASM() {
        //Spawn in all our managers
        EntityComponentSystem::SetupEntitySystem();
        //Setup physics
#ifdef PHYSICS
        new PhysicsSystem();
#endif
    }
} // namespace WASMSetup
