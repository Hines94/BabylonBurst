#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/StorageTypes.hpp"

namespace EntitySaver {

    //Includes all entities with saved data (eg for a server save)
    msgpack::sbuffer* GetFullSavePack(bool ignoreDefaultValues = true);

    //Save all data for specified entities
    msgpack::sbuffer* GetSpecificSavePack(const std::vector<EntityData*>& Ents, bool ignoreDefaultValues = true);

    std::vector<uint8_t> SBufferToUintVector(msgpack::sbuffer* save);

    //Pack multiple entities into
    void PackEntitiesData(const std::vector<std::pair<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>>>& NetworkedEnts, msgpack::packer<msgpack::sbuffer>* packer, bool ignoreDefaultValues);

    //Pack a single ent's data into the msgpack
    void PackEntityData(EntityData* ent, const EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>& comps, msgpack::packer<msgpack::sbuffer>* packer, bool ignoreDefaultValues);
} // namespace EntitySaver