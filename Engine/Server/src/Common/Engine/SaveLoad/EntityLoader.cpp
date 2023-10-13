#include "EntityLoader.h"
#include "ComponentLoader.h"
#include "Engine/Rendering/InstancedRender.hpp"
#include "Engine/Utils/MsgpackHelpers.h"
#include <stdexcept>

std::vector<std::pair<std::string, std::vector<std::string>>> EntityLoader::GetNumerisedComponentKeys(const msgpack::object& obj) {
    if (obj.type != msgpack::type::ARRAY) {
        std::cerr << "Non array passed to Get Numerised Comp Keys!" << std::endl;
        return std::vector<std::pair<std::string, std::vector<std::string>>>();
    }
    return obj.as<std::vector<std::pair<std::string, std::vector<std::string>>>>();
}

//For an entity, Get the data contained within as an easy template for later use
std::pair<Entity, std::map<std::string, msgpack::object>> getEntityForTemplate(const std::vector<std::pair<std::string, std::vector<std::string>>>& compKeys, const msgpack::object& data) {
    std::pair<Entity, std::map<std::string, msgpack::object>> entData;
    for (const auto& property : data.as<std::map<std::string, msgpack::object>>()) {
        //Entity identifier?
        if (property.first == "O") {
            entData.first = property.second.as<Entity>();
        }
        //Components?
        else if (property.first == "C") {
            auto obj_map = property.second.via.map;
            for (uint32_t i = 0; i < obj_map.size; ++i) {
                // Make sure the key is string and values are copied, not references.
                std::string key = MsgpackHelpers::ensureKeyIsString(obj_map.ptr[i].key);
                msgpack::object value = obj_map.ptr[i].val.as<msgpack::object>();

                // Using emplace to construct the element in place.
                entData.second.emplace(std::move(key), std::move(value));
            }
        }
    }
    return entData;
}

std::shared_ptr<EntityTemplate> EntityLoader::GetTemplateFromMsgpackFormat(const std::vector<std::pair<std::string, std::vector<std::string>>>& compKeys, const msgpack::object& obj) {
    if (obj.type != msgpack::type::ARRAY) {
        std::cerr << "Non array passed to Load Entities From Msgpack!" << std::endl;
        return nullptr;
    }
    //Saved as map with ent specifier O and Comps C
    //Comps saved as map with comp name and vars
    auto ret = std::make_shared<EntityTemplate>();
    ret.get()->numerisedComponents = compKeys;
    for (const auto& element : obj.as<std::vector<msgpack::object>>()) {
        ret.get()->templatedEntities.insert(getEntityForTemplate(compKeys, element));
    }
    return ret;
}

//Entity load mapping is the map from entity reference ID's to Entity data
void AddComponentsToEntities(EntityTemplate* data, const std::map<Entity, EntityData*>& NewEntities, const std::map<Entity, EntityData*>& EntityLoadMapping) {
    //Populate components for each entity
    std::vector<std::pair<Component*, EntityData*>> addedComponents;
    for (auto& ent : data->templatedEntities) {
        auto newData = NewEntities.find(ent.first)->second;
        for (auto& comp : ent.second) {
            const auto compIndex = std::stoull(comp.first);
            if (!data->ComponentExists(ent.first, compIndex)) {
                continue;
            }
            Component* newComp = data->GetComponentFromTemplatedEntity(ent.first, compIndex, EntityLoadMapping);
            const auto compInfo = data->templatedEntities.at(ent.first).find(std::to_string(compIndex));
            const auto oldComp = EntityComponentSystem::GetComponent(newData, ComponentLoader::GetTypeFromComponent(newComp));
            if (oldComp != nullptr) {
                std::cerr << "TODO: Reset saved fields back to default" << std::endl;
                oldComp->LoadFromComponentData(EntityLoadMapping, data->GetComponentDataFromMsgpack(compIndex, compInfo->second, EntityLoadMapping));
                delete (newComp);
            } else {
                if (newComp != nullptr) {
                    EntityComponentSystem::AddSetComponentToEntity(newData, newComp, true, false);
                    addedComponents.push_back({newComp, newData});
                }
            }
        }
    }
    //Call add component after (as there might be some reliances on eachother for add component)
    for (auto& comp : addedComponents) {
        comp.first->onComponentAdded(comp.second);
        comp.first->onComponentChanged(comp.second);
    }
}

std::map<Entity, EntityData*> EntityLoader::LoadTemplateToNewEntities(const std::shared_ptr<EntityTemplate> Template) {
    EntityTemplate* data = Template.get();
    //Spawn new entities and make map of original -> new
    std::map<Entity, EntityData*> NewEntities;
    for (auto& ent : data->templatedEntities) {
        NewEntities.insert({ent.first, EntityComponentSystem::AddEntity()});
    }
    AddComponentsToEntities(data, NewEntities, NewEntities);
    return NewEntities;
}

std::map<Entity, EntityData*> EntityLoader::LoadTemplateToExistingEntities(const std::shared_ptr<EntityTemplate> Template, bool overwrite) {
    EntityTemplate* data = Template.get();

    //If overwrite then delete existing first
    if (overwrite) {
        for (auto& ent : data->templatedEntities) {
            if (EntityComponentSystem::DoesEntityExist(ent.first)) {
                EntityComponentSystem::DelayedRemoveEntity(EntityComponentSystem::GetComponentDataForEntity(ent.first));
            }
        }
        EntityComponentSystem::FlushEntitySystem();
    }

    //Check for existing or create with the given ID
    std::map<Entity, EntityData*> existingEntities;
    for (auto& ent : data->templatedEntities) {
        if (ent.first == 0) {
            std::cerr << "Tried to add invalid 0 entity!" << std::endl;
            throw std::logic_error("Tried to add 0 entity! First valid ID is 1.");
        }
        if (EntityComponentSystem::DoesEntityExist(ent.first)) {
            existingEntities.insert({ent.first, EntityComponentSystem::GetComponentDataForEntity(ent.first)});
        } else {
            existingEntities.insert({ent.first, EntityComponentSystem::EnsureEntity(ent.first)});
        }
    }
    //Pass blank entities as in this case we want to use 1-1 mapping for EntityId to EntityData*
    std::map<Entity, EntityData*> blankEntities;
    AddComponentsToEntities(data, existingEntities, blankEntities);
    return existingEntities;
}

std::shared_ptr<EntityTemplate> EntityLoader::LoadTemplateFromSave(const std::vector<uint8_t>& vec) {
    size_t offset = 0;
    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(vec.data()), vec.size());
    msgpack::object obj = oh.get();
    std::map<std::string, msgpack::object> deserialized_map;
    obj.convert(deserialized_map);
    //Get types
    auto keys = GetNumerisedComponentKeys(deserialized_map.find("T")->second);
    auto templateItem = GetTemplateFromMsgpackFormat(keys, deserialized_map.find("C")->second);
    //Move handle to avoid memory deallocation
    templateItem.get()->masterHandle = std::move(oh);
    return templateItem;
}

std::shared_ptr<EntityTemplate> EntityLoader::LoadTemplateFromSave(const std::string& vec) {
    size_t offset = 0;
    msgpack::object_handle oh = msgpack::unpack(vec.data(), vec.size());
    msgpack::object obj = oh.get();
    std::map<std::string, msgpack::object> deserialized_map;
    obj.convert(deserialized_map);
    //Get types
    auto keys = GetNumerisedComponentKeys(deserialized_map.find("T")->second);
    auto templateItem = GetTemplateFromMsgpackFormat(keys, deserialized_map.find("C")->second);
    //Move handle to avoid memory deallocation
    templateItem.get()->masterHandle = std::move(oh);
    return templateItem;
}