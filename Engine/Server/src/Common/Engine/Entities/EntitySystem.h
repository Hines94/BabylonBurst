#pragma once

#include "Engine/StorageTypes.hpp"
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

//Base methods for a component. Allows networking, saving and loading of data
#define DECLARE_COMPONENT_METHODS(TypeName)                                                                                                         \
    void LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData);          \
    void LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData); \
    void GetComponentData(PackerDetails& p, bool ignoreDefaultValues, Component* childComponent = nullptr);                                         \
    bool operator==(const TypeName& other) const;                                                                                                   \
    bool isEqual(const Component* other) const;

//Custom property flags to be used with CPROPERTY
namespace PropertyFlags {
    enum Flags {
        //Network this property
        NET = 1 << 0,
        //Save this property
        SAVE = 1 << 1,
        //Do not type this property for client
        NOTYPINGS = 1 << 2,
        //Read only in Editor
        EDREAD = 1 << 3,
        //Not counted when checking if components are equal
        NOEQUALITY = 1 << 4
    };
}

//Use this macro to define a custom property for autogeneration system
#define CPROPERTY(...) // CPROPERTY(__VA_ARGS__)
namespace ComponentFlags {
    //Custom property flags to be used with CPROPERTY
    enum Flags {
        //Do not type this property for client
        NOTYPINGS = 1 << 0,
        NOSAVE = 1 << 1,
        NONETWORK = 1 << 2,
    };
} // namespace ComponentFlags

//Use this macro to define a custom component for autogeneration system
#define CCOMPONENT(...) // CCOMPONENT(__VA_ARGS__)

//In editor we require another component to be present?
#define REQUIRE_OTHER_COMPONENTS(...) // REQUIRE_OTHER_COMPONENTS(__VA_ARGS__)

//Used when we are removing components to work around TBB structures
struct RemoveCompData {
    EntityData* ent;
    EntityUnorderedSet<std::type_index> comps;
};

//Bucket which holds pointers to all entities with this mixture of components
struct BitsetBucket {
    EntityVector<EntityData*> data;
};

//Result of entity query, contains all the differing types of Ents
struct EntityQueryResult {
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

    std::vector<EntityData*> GetLimitedNumber(size_t num) {
        std::vector<EntityData*> ret;
        for (auto& bucket : buckets) {
            for (auto& ent : bucket->data) {
                ret.push_back(ent);
                if (ret.size() == num) {
                    return ret;
                }
            }
        }
        return ret;
    }
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
    //For smaller networking
    static std::vector<std::pair<std::string, std::vector<std::string>>>& GetParameterMappings() { return ActiveEntitySystem->ComponentNumerisedParams; }

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

    //For tests etc when we want to remove everything
    static void ResetEntitySystem();

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
        const T* existingSingleton = GetSingleton<T>();
        if (existingSingleton) {
            return existingSingleton;
        }
        const auto newEnt = AddEntity();
        const T* newComp = new T();
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

    static Component* GetComponent(EntityData* data, std::type_index compType);

private:
    // All entities active along with their data
    EntityUnorderedMap<Entity, EntityData*> AllEntities;
    // Map between components and entities to make things fast when getting ents of type
    EntityUnorderedMap<std::bitset<MAX_COMPONENT_TYPES>, BitsetBucket*> BitsetBucketData;
    std::vector<std::type_index> ComponentBitsetValues;
    //Using this mapping (and sending to client) we can send only a uint for comp/parameter id instead of name. Much smaller.
    std::vector<std::pair<std::string, std::vector<std::string>>> ComponentNumerisedParams;
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