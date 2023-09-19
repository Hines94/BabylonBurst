#pragma once
#include "Engine/Entities/EntitySystem.h"

class EntTransform;

REQUIRE_OTHER_COMPONENTS(EntTransform)
//TODO: Anything with this tag should lerp on the client side to make movement smoother between updates
struct ClientLerpTransform : public Component {

    //Ammt of time to lerp from(need a margin so we don't run out of packets)
    CPROPERTY(float, HistoricTime, 0.2, NET, SAVE)

    DECLARE_COMPONENT_METHODS(ClientLerpTransform)
};