#pragma once
#include "Engine/Entities/EntitySystem.h"

CCOMPONENT(NOSAVE, NONETWORK)
//Tag that signals to the client to rebuild our light
struct LightRebuildTag : public Component {
    DECLARE_COMPONENT_METHODS(LightRebuildTag)
};