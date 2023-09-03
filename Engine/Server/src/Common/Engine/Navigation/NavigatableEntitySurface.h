#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Rendering/ExtractedMeshData.h"

//A mesh that can be used to move about a Navigatable Pawn
REQUIRE_OTHER_COMPONENTS(EntTransform)
struct NavigatableEntitySurface : public Component {
    CPROPERTY(NET, SAVE)
    std::string AwsPath;
    CPROPERTY(NET, SAVE)
    std::string MeshName;

    ExtractedModelData* extractedModelData;

    void onComponentRemoved(EntityData* entData);

    void onComponentAdded(EntityData* entData);

    DECLARE_COMPONENT_METHODS(NavigatableEntitySurface)
};