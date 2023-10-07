#include "EntitySaver.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/SaveLoad/ComponentLoader.h"

msgpack::sbuffer* EntitySaver::GetFullSavePack(bool ignoreDefaultValues) {
    auto allEnts = EntityComponentSystem::GetEntitiesWithData({}, {});
    std::vector<EntityData*> allEntities;
    for (auto bucket : allEnts->buckets) {
        for (auto ent : bucket->data) {
            allEntities.push_back(ent);
        }
    }
    return GetSpecificSavePack(allEntities, ignoreDefaultValues);
}

msgpack::sbuffer* EntitySaver::GetSpecificSavePack(const std::vector<EntityData*>& Ents, bool ignoreDefaultValues) {
    msgpack::sbuffer* sbuf = new msgpack::sbuffer();
    msgpack::packer<msgpack::sbuffer>* packer = new msgpack::packer<msgpack::sbuffer>(sbuf);

    packer->pack_map(2);
    packer->pack("T");
    //TODO: We pack all parameters. Could be better to pack just the ones we need to save space? (just a small thing)
    packer->pack(EntityComponentSystem::ActiveEntitySystem->GetParameterMappings(ComponentDataType::Saving));

    packer->pack("C");
    std::vector<std::pair<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>>> ents;
    EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>> dummy;
    for (auto& ent : Ents) {
        ents.push_back({ent, dummy});
    }

    PackEntitiesData(ents, packer, ignoreDefaultValues);
    delete (packer);
    return sbuf;
}

std::vector<uint8_t> EntitySaver::SBufferToUintVector(msgpack::sbuffer* save) {
    const auto arr = std::vector<uint8_t>(save->data(), save->data() + save->size());
    delete (save);
    return arr;
}

void EntitySaver::PackEntitiesData(const std::vector<std::pair<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>>>& NetworkedEnts, msgpack::packer<msgpack::sbuffer>* packer, bool ignoreDefaultValues, bool UseNetworkingPacker) {
    auto numEnts = NetworkedEnts.size();
    if (numEnts == 0) {
        packer->pack("");
        return;
    }

    //Add the data we want
    packer->pack_array(numEnts);
    for (auto ent : NetworkedEnts) {
        PackEntityData(ent.first, ent.second, packer, ignoreDefaultValues, UseNetworkingPacker);
    }
}

//Util for packing individual entity
struct entPackInfo {
    uint numParams;
    std::type_index compId;
    Component* comp;
};

void EntitySaver::PackEntityData(EntityData* ent, const EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>& comps, msgpack::packer<msgpack::sbuffer>* packer, bool ignoreDefaultValues, bool UseNetworkingPacker) {
    auto componentMappings = EntityComponentSystem::GetBitsetMappings();

    //Pack a map with components and owning ent
    packer->pack_map(2);
    packer->pack("O");
    packer->pack(ent->owningEntity);

    packer->pack("C");
    //First do a sizing pass for entity components
    std::vector<entPackInfo> itsToPack;
    for (auto& c : ent->components) {
        std::string name(c.first.name());
        if (comps.size() > 0 && comps.find(c.first) == comps.end()) {
            continue;
        }
        if (!c.second) {
            continue;
        }
        if (!ComponentLoader::ShouldSaveComponent(c.first)) {
            continue;
        }
        PackerDetails p = {.dt = ComponentDataType::Saving, .isSizingPass = true};
        if (UseNetworkingPacker) {
            p.dt = ComponentDataType::Network;
        }
        //Sepecific properties?
        auto it = comps.find(c.first);
        if (it != comps.end()) {
            p.propsToPack = it->second;
        }

        //If part of prefab get component comparison against
        const auto defaultComp = PrefabManager::getInstance().TryGetDefaultPrefabComp(ent, ComponentLoader::GetNameFromComponent(c.second));
        c.second->GetComponentData(p, ignoreDefaultValues, defaultComp);
        //For prefabs all comps are auto added - no need to bother saving that we have this one
        if (defaultComp && p.packSize == 0) {
            if (defaultComp) {
                delete (defaultComp);
            }
            continue;
        }
        if (defaultComp) {
            delete (defaultComp);
        }

        itsToPack.push_back(entPackInfo{p.packSize, c.first, c.second});
    }

    //No components to pack? Just send entity
    if (itsToPack.size() == 0) {
        packer->pack("");
        return;
    }

    //Now do component packing
    packer->pack_map(itsToPack.size());
    for (auto& c : itsToPack) {
        //Pack with component index
        auto compIndex = std::distance(componentMappings.begin(), std::find(componentMappings.begin(), componentMappings.end(), c.compId));
        packer->pack(compIndex);
        //Nothing to pack (no params are different to base?)
        if (c.numParams == 0) {
            packer->pack("");
            continue;
        }
        packer->pack_map(c.numParams);
        //Now pack actual data
        PackerDetails pDet = {.packer = packer, .dt = ComponentDataType::Saving};
        if (UseNetworkingPacker) {
            pDet.dt = ComponentDataType::Network;
        }
        //Sepecific properties?
        auto it = comps.find(c.compId);
        if (it != comps.end()) {
            pDet.propsToPack = it->second;
        }

        const auto defaultComp = PrefabManager::getInstance().TryGetDefaultPrefabComp(ent, ComponentLoader::GetNameFromComponent(c.comp));
        c.comp->GetComponentData(pDet, ignoreDefaultValues, defaultComp);
        if (defaultComp) {
            delete (defaultComp);
        }
    }
}