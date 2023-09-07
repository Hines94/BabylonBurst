#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ExtractedMeshData.h"
#include "Engine/Rendering/ModelSpecifier.hpp"

//A mesh that can be used to move about a Navigatable Pawn
REQUIRE_OTHER_COMPONENTS(EntTransform)
struct NavigatableEntitySurface : public Component {
    CPROPERTY(NET, SAVE)
    ModelSpecifier surfaceMesh;

    ExtractedModelData* extractedModelData;

    void onComponentRemoved(EntityData* entData) override;

    void onComponentAdded(EntityData* entData) override;

    DECLARE_COMPONENT_METHODS(NavigatableEntitySurface)
};