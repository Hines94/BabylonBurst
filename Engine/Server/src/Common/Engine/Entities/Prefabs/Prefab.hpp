#include "Engine/Entities/EntitySystem.h"

// Used to identify entities that are spawned from prefabs
struct Prefab : public Component {

    DECLARE_COMPONENT_METHODS(Prefab)

    CPROPERTY(NET, SAVE, EDREAD)
    //Prefab Instance owner - Owns the 'instance' of this prefab
    EntityData* InstanceOwner;

    CPROPERTY(NET, SAVE, EDREAD)
    //UUID that can be used to identify saved prefabs and diff vs their default components
    std::string PrefabIdentifier;

    CPROPERTY(NET, SAVE, EDREAD)
    //Entity index vs this prefab (i.e we are entity 1 in the prefab)
    uint EntityIndex;
};