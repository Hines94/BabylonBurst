#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/SaveLoad/ComponentLoader.h"
#include "Engine/SaveLoad/EntityLoader.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include <emscripten/bind.h>
#include <vector>

using namespace emscripten;

//TODO: 64 will not work for now. Is this an issue?
using JSEntity = uint32_t;

bool DoesEntityExist(JSEntity entId) {
    return EntityComponentSystem::DoesEntityExist(entId);
}

JSEntity AddEntity() {
    return EntityComponentSystem::AddEntity()->owningEntity;
}

bool DelayedRemoveEntity(JSEntity EntId) {
    if (EntityComponentSystem::DoesEntityExist(EntId)) {
        EntityComponentSystem::DelayedRemoveEntity(EntityComponentSystem::GetComponentDataForEntity(EntId));
        return true;
    }
    return false;
}

bool DelayedRemoveComponent(JSEntity EntId, std::string componentName) {
    if (EntityComponentSystem::DoesEntityExist(EntId)) {
        auto tempCompId = ComponentLoader::GetComponentTypeFromName(componentName);
        if (tempCompId == typeid(void)) {
            std::cout << "WASM Error: Tried to remove bad component: " << componentName << std::endl;
            return false;
        }
        EntityComponentSystem::DelayedRemoveComponent(
            EntityComponentSystem::GetComponentDataForEntity(EntId),
            tempCompId);
        return true;
    }
    return false;
}

std::vector<uint8_t> GetAllEntities(bool ignoreDefaultValues) {
    auto buffer = EntitySaver::GetFullSavePack(ignoreDefaultValues);
    return EntitySaver::SBufferToUintVector(buffer);
}

std::vector<uint8_t> GetDataForEntity(JSEntity EntId, bool ignoreDefaultValues) {
    if (EntityComponentSystem::DoesEntityExist(EntId)) {
        std::vector<EntityData*> Ents;
        Ents.push_back(EntityComponentSystem::GetComponentDataForEntity(EntId));
        return EntitySaver::SBufferToUintVector(EntitySaver::GetSpecificSavePack(Ents, ignoreDefaultValues));
    }
    return std::vector<uint8_t>();
}

std::vector<uint8_t> GetEntitiesWithData(std::vector<std::string> includes, std::vector<std::string> excludes, bool ignoreDefaultValues) {
    //Get specific includes
    std::vector<std::type_index> includeTypes;
    for (std::string componentName : includes) {
        auto tempCompId = ComponentLoader::GetComponentTypeFromName(componentName);
        if (tempCompId == typeid(void)) {
            std::cout << "WASM Error: Tried to filter bad component: " << componentName << std::endl;
        } else {
            includeTypes.push_back(tempCompId);
        }
    }
    //Get specific excludes
    std::vector<std::type_index> excludeTypes;
    for (std::string componentName : excludes) {
        auto tempCompId = ComponentLoader::GetComponentTypeFromName(componentName);
        if (tempCompId == typeid(void)) {
            std::cout << "WASM Error: Tried to filter bad component: " << componentName << std::endl;
        } else {
            excludeTypes.push_back(tempCompId);
        }
    }

    const auto ents = EntityComponentSystem::GetEntitiesWithData(includeTypes, excludeTypes);
    const std::vector<EntityData*> foundEnts = ents->GetLimitedNumber(10000000);
    return EntitySaver::SBufferToUintVector(EntitySaver::GetSpecificSavePack(foundEnts, ignoreDefaultValues));
}

std::vector<uint8_t> GetDefaultComponentsForEntity(JSEntity entId) {
    //Get original entity
    const auto entData = EntityComponentSystem::GetComponentDataForEntity(entId);
    if (!entData) {
        return std::vector<uint8_t>();
    }
    //Create new entity with all default components
    EntityData* newEnt = EntityComponentSystem::AddEntity();
    for (const auto& comp : entData->components) {
        const auto compName = ComponentLoader::GetComponentNameFromType(comp.first);
        const auto defaultComp = PrefabManager::getInstance().TryGetDefaultPrefabComp(entData, compName);
        if (!defaultComp) {
            continue;
        }
        EntityComponentSystem::AddSetComponentToEntity(newEnt, defaultComp, false, false);
    }
    const auto data = EntitySaver::GetSpecificSavePack({newEnt}, false);
    //Clean up & return
    EntityComponentSystem::DelayedRemoveEntity(newEnt);
    EntityComponentSystem::FlushEntitySystem();
    return EntitySaver::SBufferToUintVector(data);
}

void FlushEntitySystem() {
    EntityComponentSystem::FlushEntitySystem();
}

void ResetEntitySystem() {
    EntityComponentSystem::ResetEntitySystem();
}

void LoadPrefabByIdToExisting(std::string Id, bool overwrite) {
    const auto entTemp = PrefabManager::getInstance().GetPrefabTemplateById(Id);
    if (entTemp) {
        EntityLoader::LoadTemplateToExistingEntities(entTemp.value(), overwrite);
    }
}

std::vector<JSEntity> LoadMsgpackDataToNewEntities(std::vector<uint8_t> entityData) {
    const auto templateData = EntityLoader::LoadTemplateFromSave(entityData);
    const auto newEnts = EntityLoader::LoadTemplateToNewEntities(templateData);
    //Return raw entities - no point in sending EntityData
    std::vector<JSEntity> rawEnts;
    rawEnts.reserve(newEnts.size());
    for (const auto& pair : newEnts) {
        rawEnts.push_back(pair.first);
    }
    return rawEnts;
}

void LoadMsgpackDataToExistingEntities(std::vector<uint8_t> entityData, bool overwrite) {
    const auto templateData = EntityLoader::LoadTemplateFromSave(entityData);
    const auto newEnts = EntityLoader::LoadTemplateToExistingEntities(templateData, overwrite);
}

void ReloadPrefabData(std::string prefabLocation, std::string prefabName, std::vector<uint8_t> prefabData) {
    PrefabManager::getInstance().SetupPrefabFromBinary(prefabLocation, prefabName, prefabData);
}

//TODO: Add client entity with offset

EMSCRIPTEN_BINDINGS(WASMEntityInterface) {
    function("DoesEntityExist", &DoesEntityExist);
    function("DelayedRemoveEntity", &DelayedRemoveEntity);
    function("DelayedRemoveComponent", &DelayedRemoveComponent);
    function("AddEntity", &AddEntity);
    function("GetDataForEntity", &GetDataForEntity);
    function("GetAllEntities", &GetAllEntities);
    function("FlushEntitySystem", &FlushEntitySystem);
    function("LoadMsgpackDataToNewEntities", &LoadMsgpackDataToNewEntities);
    function("LoadMsgpackDataToExistingEntities", &LoadMsgpackDataToExistingEntities);
    function("GetEntitiesWithData", &GetEntitiesWithData);
    function("ResetEntitySystem", &ResetEntitySystem);
    function("GetDefaultComponentsForEntity", &GetDefaultComponentsForEntity);
    function("ReloadPrefabData", &ReloadPrefabData);
    function("LoadPrefabByIdToExisting", &LoadPrefabByIdToExisting);
}
