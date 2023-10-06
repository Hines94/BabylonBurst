#pragma once
#include "Engine/Entities/EntitySystem.h"

//A item that can be selected in world space
struct SelectableComponent : public Component {
    DECLARE_COMPONENT_METHODS(SelectableComponent)
    //Size of the selection pane to show for this item
    CPROPERTY(float,SelectionScale,5,SAVE,NET)
};