#include "EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/SaveLoad/ComponentLoader.h"
#include "Engine/Utils/Environment.h"
#include "Engine/Utils/StringUtils.h"
#include <iostream>
#include <limits>
#include <unordered_set>

EntityData::EntityData(Entity owningEntity) : owningEntity(owningEntity) {}

EntityComponentSystem* EntityComponentSystem::ActiveEntitySystem = nullptr;

EntityComponentSystem::EntityComponentSystem() {
    EntityComponentSystem::ActiveEntitySystem = this;
    std::bitset<MAX_COMPONENT_TYPES> empty;
    ensureBucketExists(empty);

    checkComponentCompLoader = Environment::GetDebugMode() != DebugMode::None;
}

void EntityComponentSystem::ResetEntitySystem() {
    for (auto& ent : ActiveEntitySystem->AllEntities) {
        DelayedRemoveEntity(ent.second);
    }
    ActiveEntitySystem->entitySpawnNum = 0;
    ClearNetworkData();
    FlushEntitySystem();
}

const msgpack::object* Component::GetCompData(const std::string& key, const std::map<std::string, msgpack::object>& compData) {
    auto it = compData.find(key);
    if (it == compData.end()) {
        return nullptr;
    }
    return &(it->second);
}

bool EntityComponentSystem::HasComponent(EntityData* data, std::type_index compType) {
    return data->components.find(compType) != data->components.end();
}
//NOTE: This will be in the parent (component) class!
Component* EntityComponentSystem::GetComponent(EntityData* data, std::type_index compType) {
    auto compIt = data->components.find(compType);
    if (compIt != data->components.end()) {
        return data->components[compType];
    } else {
        return nullptr;
    }
}

bool EntityComponentSystem::IsValid(EntityData* data) {
    return data != nullptr && data->owningEntity != 0;
}

void EntityComponentSystem::SetupEntitySystem() {
    if (EntityComponentSystem::ActiveEntitySystem != nullptr) {
        throw std::runtime_error("Tried to write over existing entity system!");
    }
    new EntityComponentSystem();
}

//Remove entity after the current system finishes - Deliberately the only remove method (removeEntity is not thread safe!)
void EntityComponentSystem::DelayedRemoveEntity(EntityData* Entity) {
    if (EntityComponentSystem::IsValid(Entity) == false || Entity->inDeletion == true) {
        return;
    }
    Entity->inDeletion = true;
    ActiveEntitySystem->DelayedRemoveEntities.insert(Entity);
}

//Parallel remove any entities we want to delete
void EntityComponentSystem::RemoveDelayedEntities() {
    //We may have to run multiple batches, if one entity destroys another in cleanup etc
    while (ActiveEntitySystem->DelayedRemoveEntities.size() > 0) {
        EntityVector<EntityData*> removals(ActiveEntitySystem->DelayedRemoveEntities.size());
        int i = 0;
        for (auto const& e : ActiveEntitySystem->DelayedRemoveEntities) {
            removals[i++] = e;
        }
        ActiveEntitySystem->DelayedRemoveEntities.clear();
        EntityTaskRunners::AutoPerformTasksSeries<EntityData>("EntityRemoval", removals, EntityComponentSystem::RemoveEntity, 0);
    }
}

//NOTE: VERY BAD IDEA TO CALL DIRECTLY. SERIOUSLY, JUST USE REMOVE DELAYED!
void EntityComponentSystem::RemoveEntity(double deltaTime, EntityData* data) {
    int entId = data->owningEntity;

    // First remove components from any maps
    for (auto& comp : data->components) {
        DeleteEntityComponent(comp.first, data);
    }

    //Remove from bitset bucket
    removeFromBitsetBucket(data);

    // Next delete entity data
    delete (data);

    // Next remove from all entities
#ifdef __EMSCRIPTEN__
    ActiveEntitySystem->AllEntities.erase(entId);
    // Ensure we are not networking this down
    ActiveEntitySystem->EntDataToNetwork.erase(data);
#else
    ActiveEntitySystem->AllEntities.unsafe_erase(entId);
    // Ensure we are not networking this down
    ActiveEntitySystem->EntDataToNetwork.unsafe_erase(data);
#endif

    // Network that this entity has been deleted
    if (ActiveEntitySystem->DeletedEntDataToNetwork.find(entId) != ActiveEntitySystem->DeletedEntDataToNetwork.end()) {
        ActiveEntitySystem->DeletedEntDataToNetwork[entId].clear();
    }
    auto fullDelete = std::vector<std::string>({"__F__"});
    ActiveEntitySystem->DeletedEntDataToNetwork.insert(std::pair(entId, fullDelete));
}

//ASSUMES SERIES RUNNING
void EntityComponentSystem::CleanupBitsetBuckets() {
    for (auto& val : ActiveEntitySystem->dirtyBitsetItems) {
        if (!val) {
            continue;
        }
        removeFromBitsetBucket(val);
        ensureBucketExists(val->componentBitset);
        auto newBucket = ActiveEntitySystem->BitsetBucketData.find(val->componentBitset)->second;
        newBucket->data.push_back(val);
        val->currentBucket = newBucket;
        val->bitBucketIndex = newBucket->data.size() - 1;
    }
    ActiveEntitySystem->dirtyBitsetItems.clear();
}

//ASSUMES SERIES RUNNING!
void EntityComponentSystem::removeFromBitsetBucket(EntityData* entData) {
    if (!entData || !entData->currentBucket) {
        return;
    }
    //Move item to the back
    auto size = entData->currentBucket->data.size();
    auto index = entData->bitBucketIndex;
    if (index < size - 1) {
        //Move last item to our index
        entData->currentBucket->data[index] = entData->currentBucket->data[size - 1];
    }
    //resize
    entData->currentBucket->data.resize(size - 1);
    entData->currentBucket = nullptr;
}

//Remove all delayed components that have built up
void EntityComponentSystem::RemoveDelayedComponents() {
    //We may have to run multiple batches, if one component destroys another in cleanup etc
    while (ActiveEntitySystem->DelayedRemoveComponents.size() > 0) {
        //Copy over removals
        EntityVector<RemoveCompData*> removals;
        for (auto& comp : ActiveEntitySystem->DelayedRemoveComponents) {
            RemoveCompData* task = new RemoveCompData();
            task->ent = comp.first;
            task->comps = comp.second;
            removals.push_back(task);
        }
        ActiveEntitySystem->DelayedRemoveComponents.clear();
        //Perform actual removals - Has to be in series due to our
        EntityTaskRunners::AutoPerformTasksParallel<RemoveCompData>("CompRemoval", removals, EntityComponentSystem::removeComponent, 0.0);
    }
}

// Adds to the list to be removed at the end of the current system - Deliberately the only remove method (removeComponent is not thread safe!)
void EntityComponentSystem::DelayedRemoveComponent(EntityData* Entity, std::type_index compType) {
    //Check already got a setup of comps to remove?
    if (ActiveEntitySystem->DelayedRemoveComponents.find(Entity) == ActiveEntitySystem->DelayedRemoveComponents.end()) {
        auto entityData = std::pair<EntityData*, EntityUnorderedSet<std::type_index>>(Entity, EntityUnorderedSet<std::type_index>());
        entityData.second.insert(compType);
        ActiveEntitySystem->DelayedRemoveComponents.insert(entityData);
    } else {
        //Add comp to be removed
        ActiveEntitySystem->DelayedRemoveComponents[Entity].insert(compType);
    }
}

void EntityComponentSystem::removeComponent(double dt, RemoveCompData* data) {
    for (auto& comp : data->comps) {
        DeleteEntityComponent(comp, data->ent);
    }
    delete (data);
}

//Assumes no other thread is touching this particular component
void EntityComponentSystem::DeleteEntityComponent(const std::type_index& compType, EntityData* data) {
    //Check we actually have the comp!
    auto it = data->components.find(compType);
    if (it == data->components.end()) {
        return;
    }

    auto comp = it->second;

    //Call remove on comp
    comp->onComponentRemoved(data);

    if (data->inDeletion == false) {
        //Change bitmask
        auto bitsetIndex = GetBitsetIndex(compType);
        data->componentBitset[bitsetIndex] = 0;
        //Remove from components in our entity data
#ifdef __EMSCRIPTEN__
        data->components.erase(it);
#else
        data->components.unsafe_erase(it);
#endif
        //Notify that we need to refresh the bitset bucket
        ActiveEntitySystem->dirtyBitsetItems.insert(data);
        //Mark in deletions
        auto entId = data->owningEntity;
        auto compName = StringUtils::RemoveNumericPrefix(compType.name());

        PackerDetails p = {.dt = ComponentDataType::Network, .isSizingPass = true};
        comp->GetComponentData(p, false);
        if (p.compPropertyNum > 0) {
            if (ActiveEntitySystem->DeletedEntDataToNetwork.find(entId) == ActiveEntitySystem->DeletedEntDataToNetwork.end()) {
                auto fullDelete = std::vector<std::string>({compName});
                ActiveEntitySystem->DeletedEntDataToNetwork.insert(std::pair(entId, fullDelete));
            } else {
                ActiveEntitySystem->DeletedEntDataToNetwork[entId].push_back(compName);
            }
        }
    }

    //Delete component itself
    delete (comp);
}

// Method for easily getting all components related to a specific entity
EntityData* EntityComponentSystem::GetComponentDataForEntity(Entity ent) {
    auto it = ActiveEntitySystem->AllEntities.find(ent);
    if (it == ActiveEntitySystem->AllEntities.end()) {
        return nullptr;
    }
    return it->second;
}

// Check if an entity exists at this current time
bool EntityComponentSystem::DoesEntityExist(Entity ent) {
    auto it = ActiveEntitySystem->AllEntities.find(ent);
    return it != ActiveEntitySystem->AllEntities.end();
}

void EntityComponentSystem::MarkCompToNetwork(EntityData* entityId, std::type_index compType, std::vector<std::string> properties) {
    //This entity has other networking data this frame?
    auto search = ActiveEntitySystem->EntDataToNetwork.find(entityId);
    if (search == ActiveEntitySystem->EntDataToNetwork.end()) {
        std::pair<EntityData*, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>> freshData(entityId, EntityUnorderedMap<std::type_index, EntityUnorderedSet<std::string>>());
        ActiveEntitySystem->EntDataToNetwork.insert(freshData);
    }
    //Comp is already tagged to be networked?
    auto& comps = ActiveEntitySystem->EntDataToNetwork.find(entityId)->second;
    auto it = comps.find(compType);
    bool existing = true;
    if (it == comps.end()) {
        comps.insert(std::make_pair(compType, EntityUnorderedSet<std::string>()));
        existing = false;
    }
    //"Blank" vector means All properties - therefore, if already blank no need
    auto& compProps = comps.find(compType)->second;
    if (existing && compProps.size() == 0) {
        return;
    }
    //We are networking everything?
    if (properties.size() == 0) {
        compProps.clear();
        return;
    }
    //Specific props?
    for (auto& p : properties) {
        compProps.insert(p);
    }
}

/**
 * Extreme fast method for getting all entities of given types.
 * 
 * @param includeTypes All types that must be included. Easy use - {typeid(Comp1), typeid(Comp2)}
 * @param excludeTypes All types that must NOT be included. Easy use - {typeid(Comp1), typeid(Comp2)}
 * 
 * @return A shared pointer to an EntityQueryResult containing all entities that have the specified component types.
 */
std::shared_ptr<EntityQueryResult> EntityComponentSystem::GetEntitiesWithData(std::vector<std::type_index> includeTypes, std::vector<std::type_index> excludeTypes) {
    std::shared_ptr<EntityQueryResult> queryResult = std::make_shared<EntityQueryResult>();

    //Create a bitset so we can rapidly compare without too much iteration
    std::bitset<MAX_COMPONENT_TYPES> includeComponentsBitset;
    std::bitset<MAX_COMPONENT_TYPES> excludeComponentsBitset;

    for (const auto& component : includeTypes) {
        auto componentIndex = GetBitsetIndex(component);
        //If 0 then no buckets for this comp yet and therefore nothing has it included!
        if (componentIndex == 0) {
            return queryResult;
        }
        includeComponentsBitset.set(componentIndex);
    }
    for (const auto& component : excludeTypes) {
        auto componentIndex = GetBitsetIndex(component);
        //If 0 then no buckets for this comp yet
        if (componentIndex == 0) {
            continue;
        }
        excludeComponentsBitset.set(componentIndex);
    }
    for (auto& bucket : ActiveEntitySystem->BitsetBucketData) {
        auto bucketBitset = bucket.first;
        if ((bucketBitset & includeComponentsBitset) == includeComponentsBitset &&
            (bucketBitset & excludeComponentsBitset).none()) {
            queryResult.get()->buckets.push_back(bucket.second);
        }
    }
    return queryResult;
}

//Create a fresh entity with data holder
EntityData* EntityComponentSystem::AddEntity() {
    Entity newEntity = ++ActiveEntitySystem->entitySpawnNum;
    // Create new Ent
    return ActiveEntitySystem->createEntity(newEntity);
}

EntityData* EntityComponentSystem::createEntity(Entity entityId) {
    const auto entData = new EntityData(entityId);
    std::pair<Entity, EntityData*> pair(entityId, entData);
    AllEntities.insert(pair);
    dirtyBitsetItems.insert(entData);
    return entData;
}

EntityData* EntityComponentSystem::EnsureEntity(Entity entityId) {
    //If behind then jump to this point
    if (ActiveEntitySystem->entitySpawnNum < entityId) {
        ActiveEntitySystem->entitySpawnNum = entityId - 1;
        return AddEntity();
    } else {
        if (!DoesEntityExist(entityId)) {
            return ActiveEntitySystem->createEntity(entityId);
        }
        return GetComponentDataForEntity(entityId);
    }
}

//NOTE: Damages Queries for this until after the system flushes
void EntityComponentSystem::AddSetComponentToEntity(EntityData* entityData, Component* comp, bool autoNetwork, bool callAdded) {
    // Check entity exists
    if (!EntityComponentSystem::IsValid(entityData)) {
        return;
    }

    // Get the component's name and type
    std::type_index compType = typeid(*comp);

    //If already exists then simply change
    if (HasComponent(entityData, compType) == false) {
        // Add data to component store
        ActiveEntitySystem->ensureBitsetContains(compType, comp);
        // Change bitset
        entityData->bitsetMutex.lock();
        auto bitsetIndex = GetBitsetIndex(compType);
        entityData->componentBitset[bitsetIndex] = 1;
        entityData->bitsetMutex.unlock();
        //Add to dirty list
        ActiveEntitySystem->dirtyBitsetItems.insert(entityData);
    } else {
        //Delete old component
        delete GetComponent(entityData, compType);
    }

    //Set data in entity
    entityData->components[compType] = comp;

    //Added method
    if (callAdded) {
        comp->onComponentAdded(entityData);
    }

    //Mark as dirty for first change
    if (autoNetwork) {
        MarkCompToNetwork(entityData, compType);
    }
}

void EntityComponentSystem::ensureBitsetContains(std::type_index compType, Component* comp) {
    //Quick read check first
    if (GetBitsetIndex(compType) != 0) {
        return;
    }
    //Full write
    std::unique_lock writeLock(ActiveEntitySystem->bitsetTypesMutex);
    if (GetBitsetIndex(compType, false) != 0) {
        return;
    }
    ActiveEntitySystem->ComponentBitsetValues.push_back(compType);
    if (ActiveEntitySystem->ComponentBitsetValues.size() > MAX_COMPONENT_TYPES - 1) {
        std::cout << "ERROR: TOO MANY COMPONENTS. UP MAX COMPONENT TYPES!" << std::endl;
        std::exit(EXIT_FAILURE);
    }
    //Add to component index mappings
    PackerDetails p = {.dt = ComponentDataType::Network, .isNamingPass = true};
    comp->GetComponentData(p, false);
    ActiveEntitySystem->ComponentNumerisedParams.push_back(std::make_pair(StringUtils::RemoveNumericPrefix(compType.name()), p.names));
    if (ActiveEntitySystem->checkComponentCompLoader) {
        auto compName = StringUtils::RemoveNumericPrefix(compType.name());
        auto spawned = ComponentLoader::GetComponentFromName(compName);
        if (spawned != nullptr) {
            delete (spawned);
        }
    }
}

int EntityComponentSystem::GetBitsetIndex(std::type_index type, bool lock) {
    if (lock) {
        std::shared_lock readLock(ActiveEntitySystem->bitsetTypesMutex);
    }
    for (int i = 0; i < ActiveEntitySystem->ComponentBitsetValues.size(); i++) {
        if (ActiveEntitySystem->ComponentBitsetValues[i] == type) {
            return i + 1;
        }
    }
    return 0;
}

void EntityComponentSystem::ensureBucketExists(std::bitset<MAX_COMPONENT_TYPES> components) {
    if (ActiveEntitySystem->BitsetBucketData.find(components) == ActiveEntitySystem->BitsetBucketData.end()) {
        ActiveEntitySystem->BitsetBucketData.insert(std::pair<std::bitset<MAX_COMPONENT_TYPES>, BitsetBucket*>(components, new BitsetBucket()));
    }
}