#pragma once

#include "Engine/StorageTypes.hpp"
#include "EntityMacros.hpp"
#include "ICustomMsgpack.h"
#include "PackerDetails.hpp"
#include <atomic>
#include <bitset>
#include <iostream>
#include <map>
#include <msgpack.hpp>
#include <shared_mutex>
#include <stdexcept>
#include <typeindex>
#include <vector>

const int MAX_COMPONENT_TYPES = 100;

class EntityData;

using Entity = uint64_t;

//Generic component base that contains methods for networking, saving and loading & helper addition/remove methods. USE MUTEX when parallel writing.
struct Component {
public:
    //Use this mutex to protect when you write data to this component!
    mutable std::shared_mutex writeMutex;

    virtual ~Component() {}

    virtual void onComponentAdded(EntityData* entData){};

    virtual void onComponentRemoved(EntityData* entData){};

    virtual void onComponentOverwritten(EntityData* entData, Component* newComp){};

    virtual void onComponentChanged(EntityData* entData){};

    //Setup variables so we know when something has changed
    virtual void SetupTrackedVariables(EntityData* Owner) = 0;

    virtual bool isEqual(const Component* other) const = 0;

    /// @brief Note: No vars returned will not be networked or saved
    /// @param details Packer details so we can provide the correct count/data
    /// @param childComponent Optional child comp to test against. If nullptr will check against base (new instance)
    virtual void GetComponentData(PackerDetails& details, bool ignoreDefaultValues, Component* childComponent = nullptr) = 0; // Pure virtual to require in child

    //Load our data back into this component
    virtual void LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) = 0; // Pure virtual to require in child

    //If no data has been set in a field then load these values in (useful for prefab)
    virtual void LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) = 0; // Pure virtual to require in child

    //Helper function for loading data
    const msgpack::object* GetCompData(const std::string& key, const std::map<std::string, msgpack::object>& compData);
};

//Used when we are removing components to work around TBB structures
struct RemoveCompData {
    EntityData* ent;
    EntityUnorderedSet<std::type_index> comps;
};

//Bucket which holds pointers to all entities with this mixture of components
struct BitsetBucket {
    EntityVector<EntityData*> data;
};

CCOMPONENT(NOTYPINGS)
//Contains the primary info on our entities
struct EntityData : public ICustomMsgpack {
    Entity owningEntity;
    EntityUnorderedMap<std::type_index, Component*> components;

    //The bucket we currently are in (could be dirty)
    uint32_t bitBucketIndex;
    BitsetBucket* currentBucket = nullptr;

    mutable std::shared_mutex bitsetMutex;
    std::bitset<MAX_COMPONENT_TYPES> componentBitset;

    //One way switch
    std::atomic<bool> inDeletion = false;

    EntityData(Entity owningEntity);

    static void PackSerializeData(PackerDetails& p, EntityData* data) {
        if (data == nullptr) {
            p.packer->pack(0);
        } else {
            p.packer->pack(data->owningEntity);
        }
    }

    static EntityData* LoadFromSerializeData(const std::map<Entity, EntityData*>& OldNewEntMap, const msgpack::object* data) {
        Entity ent;
        //Not a positive integer - could be a str if blank etc
        if (data->type != 2) {
            return nullptr;
        }
        data->convert(ent);
        if (ent == 0) {
            return nullptr;
        }
        auto it = OldNewEntMap.find(ent);
        if (it == OldNewEntMap.end()) {
            return nullptr;
        }
        return it->second;
    }
};

//TODO: Make Tracked entityData

//Result of entity query, contains all the differing types of Ents
struct EntityQueryResult {
    std::vector<std::type_index> includedComponents;
    std::vector<std::type_index> excludedComponents;
    std::vector<std::function<bool(EntityData*, EntityQueryResult*)>> entityFilters;
    std::vector<BitsetBucket*> buckets;

    size_t size() {
        size_t val = 0;
        if (buckets.size() == 0) {
            return 0;
        }
        for (auto& bucket : buckets) {
            val += bucket->data.size();
        }
        return val;
    }

    std::vector<EntityData*> GetLimitedNumber(int num = -1) {
        std::vector<EntityData*> ret;

        //Reserve for performance
        int size = 0;
        for (const auto& bucket : buckets) {
            size += bucket->data.size();
        }
        ret.reserve(size);

        //Inserts
        for (const auto& bucket : buckets) {
            ret.insert(ret.end(), bucket->data.begin(), bucket->data.end());
        }

        //Filters
        if (entityFilters.size() > 0) {
            std::vector<EntityData*> filtered;
            filtered.reserve(ret.size());
            for (const auto& e : ret) {
                bool pass = true;
                for (const auto& f : entityFilters) {
                    if (!f(e, this)) {
                        pass = false;
                        break;
                    }
                }
                if (pass) {
                    filtered.push_back(e);
                }
            }
            ret = filtered;
        }

        //Max size?
        if (num > 0 && ret.size() > num) {
            ret.resize(num);
        }

        return ret;
    }

    template <typename T>
    std::vector<T*> GetAllComponents() {
        std::type_index compType = typeid(T);
        std::vector<T*> ret;
        for (auto& bucket : buckets) {
            for (auto& ent : bucket->data) {
                if (ent->components.find(compType) != ent->components.end()) {
                    ret.push_back(dynamic_cast<T*>(ent->components[compType]));
                }
            }
        }
        return ret;
    }

    //Only entities with changed components (any of them) will be included
    void AddChangedOnlyQuery_Any(std::vector<std::type_index> specificComps = {});
    //Only entities with changed components (all of them) will be included
    void AddChangedOnlyQuery_All(std::vector<std::type_index> specificComps = {});

    //Only entities with Unchanged components (any of them) will be included
    void AddUnchangedOnlyQuery_Any(std::vector<std::type_index> specificComps = {});
    //Only entities with Unchanged components (all of them) will be included
    void AddUnchangedOnlyQuery_All(std::vector<std::type_index> specificComps = {});
};

//Note: this is not a "full" ECS system - we do not use the proper memory techniques, all data is on the heap.
//However, we get the other benefits of the ECS style such as easy saving and networking and it makes things far easier for parallelistation
class EntityComponentSystem {
public:
    static void SetupEntitySystem();
    static EntityComponentSystem* ActiveEntitySystem;

    EntityComponentSystem();

    //Static entity methods
public:
    static bool DoesEntityExist(Entity entityId);
    static EntityData* AddEntity();
    //Ensure we have specified Entity (eg same as server for WASM)
    static EntityData* EnsureEntity(Entity entityId);
    static void DelayedRemoveEntity(EntityData* entId);
    static std::shared_ptr<EntityQueryResult> GetEntitiesWithData(std::vector<std::type_index> includeTypes, std::vector<std::type_index> excludeTypes);
    static EntityData* GetComponentDataForEntity(Entity entityId);
    static void AddSetComponentToEntity(EntityData* entityData, Component* comp, bool autoNetwork = true, bool callAdded = true);
    //Leave properties as blank to network all properties
    static void MarkCompToNetwork(EntityData* entity, std::type_index compType, std::vector<std::string> properties = std::vector<std::string>());
    static int GetNumberEntitiesSpawned() { return ActiveEntitySystem->entitySpawnNum; }
    static int GetNumberActiveEntities() { return ActiveEntitySystem->AllEntities.size(); }
    static bool IsValid(EntityData* data);
    static bool HasComponent(EntityData* data, std::type_index compType);
    static void DelayedRemoveComponent(EntityData* Entity, std::type_index compType);
    static std::vector<std::type_index> GetBitsetMappings() { return ActiveEntitySystem->ComponentBitsetValues; }
    //For smaller networking & saving
    std::vector<std::pair<std::string, std::vector<std::string>>> GetParameterMappings(ComponentDataType packType);

    //For our callback from Entity system
    static void OnComponentChanged(EntityData* ent, std::type_index compType);

    static void SetParallelMode(bool inParallel) { ActiveEntitySystem->inParallel = inParallel; }

    static EntityUnorderedMap<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>> GetNetworkData() {
        return ActiveEntitySystem->EntDataToNetwork;
    }
    static std::unordered_map<uint64_t, std::vector<std::string>> GetDeletedNetworkData() {
        return ActiveEntitySystem->DeletedEntDataToNetwork;
    }
    static void ClearNetworkData() {
        ActiveEntitySystem->EntDataToNetwork.clear();
        ActiveEntitySystem->DeletedEntDataToNetwork.clear();
    }

    //Called between different system updates to cleanup the items they wanted delt with
    static void FlushEntitySystem() {
        if (ActiveEntitySystem->inParallel) {
            throw std::logic_error("Called flush Entities when running parallel!");
        }
        RemoveDelayedComponents();
        CleanupBitsetBuckets();
        RemoveDelayedEntities();
    }

    //Called at end of frame
    static void ResetChangedEntities() {
        ActiveEntitySystem->ChangedComponents.clear();
    }

    //For tests etc when we want to remove everything
    static void ResetEntitySystem();
    void SetupTrackedVaraibles(EntityData* Owner);

    //Templated
public:
    template <typename T>
    static void DelayedRemoveComponent(EntityData* Entity) {
        std::type_index compType = typeid(T);
        DelayedRemoveComponent(Entity, compType);
    }

    template <typename T>
    static void MarkCompToNetwork(EntityData* entity, std::vector<std::string> properties = std::vector<std::string>()) {
        MarkCompToNetwork(entity, typeid(T), properties);
    }

    template <typename T>
    static bool HasComponent(EntityData* data) {
        std::type_index compType = typeid(T);
        return HasComponent(data, compType);
    }

    template <typename T>
    static T* GetComponent(EntityData* data) {
        std::type_index compType = typeid(T);
        auto compIt = data->components.find(compType);
        if (compIt != data->components.end()) {
            return dynamic_cast<T*>(data->components[compType]);
        } else {
            return nullptr;
        }
    }

    template <typename T>
    static T* GetOrCreateSingleton() {
        T* existingSingleton = GetSingleton<T>();
        if (existingSingleton) {
            return existingSingleton;
        }
        const auto newEnt = AddEntity();
        T* newComp = new T();
        AddSetComponentToEntity(newEnt, newComp);
        return newComp;
    }

    template <typename T>
    static T* GetSingleton() {
        const std::type_index typeC = typeid(T);
        const auto query = GetEntitiesWithData({typeC}, {});
        const auto numE = query.get()->size();
        if (numE == 0) {
            return nullptr;
        }
        if (numE > 1) {
            std::cerr << "Asked for singleton with type " << typeC.name() << " but multiple!" << std::endl;
        }
        return GetComponent<T>(query.get()->GetLimitedNumber(1)[0]);
    }

    //NOTE: Only valid after changes (eg if we check before a system run then will not count)
    template <typename T>
    static bool CheckComponentChanged(EntityData* ent) {
        const std::type_index typeC = typeid(T);
        return CheckComponentChanged(ent, typeC);
    }
    static bool CheckComponentChanged(EntityData* ent, std::type_index compType);

    static Component* GetComponent(EntityData* data, std::type_index compType);

private:
    // All entities active along with their data
    EntityUnorderedMap<Entity, EntityData*> AllEntities;
    // Map between components and entities to make things fast when getting ents of type
    EntityUnorderedMap<std::bitset<MAX_COMPONENT_TYPES>, BitsetBucket*> BitsetBucketData;
    std::vector<std::type_index> ComponentBitsetValues;
    //Using this mapping (and sending to client) we can send only a uint for comp/parameter id instead of name. Much smaller.
    std::vector<Component*> OrderedComponentParams;
    // Entities to be removed at end of current system - safer than removing during system parallel tasks
    EntityUnorderedSet<EntityData*> DelayedRemoveEntities;
    // Components to be removed at end of current system - safer than removing during system parallel tasks
    EntityUnorderedMap<EntityData*, EntityUnorderedSet<std::type_index>> DelayedRemoveComponents;
    // Entities/Entity components/properties to be networked to the player
    EntityUnorderedMap<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>> EntDataToNetwork;
    // Bitset items that need to be updated this frame due to additions/removals
    EntityUnorderedSet<EntityData*> dirtyBitsetItems;
    // Entities deleted this frame, to be networked to the player
    std::unordered_map<uint64_t, std::vector<std::string>> DeletedEntDataToNetwork;
    // Entities that have changed in this frame
    EntityUnorderedMap<EntityData*, EntityUnorderedSet<std::type_index>> ChangedComponents;

    EntityData* createEntity(Entity entId);

    std::atomic<Entity> entitySpawnNum = 0;
    bool inParallel = false;
    mutable std::shared_mutex bitsetTypesMutex;

    static int GetBitsetIndex(std::type_index type, bool lock = true);

    static void DeleteEntityComponent(const std::type_index& comp, EntityData* data);
    static void RemoveDelayedEntities();
    static void RemoveDelayedComponents();
    static void CleanupBitsetBuckets();
    static void RemoveEntity(double deltaTime, EntityData* data);
    static void removeComponent(double dt, RemoveCompData* data);
    static void removeFromBitsetBucket(EntityData* data);
    static void ensureBitsetContains(std::type_index comp_id, Component* comp);
    static void ensureBucketExists(std::bitset<MAX_COMPONENT_TYPES> components);

    bool checkComponentCompLoader = false;

    int deleteNum = 0;
};