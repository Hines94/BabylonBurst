#include "EntityTemplate.h"
#include "ComponentLoader.h"
#include "Utils/MsgpackHelpers.h"

std::map<std::string, msgpack::object> EntityTemplate::GetComponentDataFromMsgpack(size_t compId, const msgpack::object& data, const std::map<Entity, EntityData*>& entMapping) {
    if (data.type != msgpack::type::MAP) {
        return std::map<std::string, msgpack::object>();
    }
    auto compMappings = numerisedComponents.at(compId);
    std::map<std::string, msgpack::object> compData;
    auto comp_map = data.via.map;
    for (uint32_t i = 0; i < comp_map.size; ++i) {
        //This could be a str if saved or sent TS or could be int if staying c++ -  safer to convert in case
        compData.insert(std::make_pair(compMappings.second[std::stoull(MsgpackHelpers::ensureKeyIsString(comp_map.ptr[i].key))], comp_map.ptr[i].val.as<msgpack::object>()));
    }
    return compData;
}

Component* EntityTemplate::unpackComponentIndividual(size_t compId, const msgpack::object& data, const std::map<Entity, EntityData*>& entMapping) {
    //Get base component type
    if (numerisedComponents.size() <= compId) {
        std::cerr << "Numerised components too small! Requested num: " << compId << " max size: " << numerisedComponents.size() << std::endl;
        return nullptr;
    }
    auto compMappings = numerisedComponents.at(compId);
    Component* comp = ComponentLoader::GetComponentFromName(compMappings.first);
    //Populate
    if (comp != nullptr) {
        //Get mapping for params
        std::map<std::string, msgpack::object> compData = GetComponentDataFromMsgpack(compId, data, entMapping);
        //Set data in comp
        comp->LoadFromComponentData(entMapping, compData);
    } else {
        std::cerr << "Component could not be found to add: " << compMappings.first << std::endl;
    }
    return comp;
}

Component* EntityTemplate::GetComponentFromTemplatedEntity(Entity ent, std::string compName, const std::map<Entity, EntityData*>& NewEntities) {
    return GetComponentFromTemplatedEntity(ent, GetComponentAsIndex(compName), NewEntities);
}

Component* EntityTemplate::GetComponentFromTemplatedEntity(Entity ent, int compIndex, const std::map<Entity, EntityData*>& NewEntities) {
    if (!ComponentExists(ent, compIndex)) {
        return nullptr;
    }
    return unpackComponentIndividual(compIndex, templatedEntities.find(ent)->second.find(std::to_string(compIndex))->second, NewEntities);
}

bool EntityTemplate::EntityExists(Entity ent) {
    return templatedEntities.contains(ent);
}

bool EntityTemplate::ComponentExists(Entity ent, std::string compName) {
    return ComponentExists(ent, GetComponentAsIndex(compName));
}

bool EntityTemplate::ComponentExists(Entity ent, int compIndex) {
    if (!EntityExists(ent)) {
        return false;
    }
    if (compIndex < 0) {
        return false;
    }
    return templatedEntities.at(ent).contains(std::to_string(compIndex));
}

bool EntityTemplate::ParameterExists(Entity ent, std::string compName, std::string paramName) {
    if (!ComponentExists(ent, compName)) {
        return false;
    }
    const int compIndex = GetComponentAsIndex(compName);
    const std::string paramIndex = std::to_string(GetParameterAsIndex(compIndex, paramName));
    if (paramIndex == "-1") {
        return false;
    }

    auto param_map = templatedEntities.at(ent).at(std::to_string(compIndex)).via.map;
    for (uint32_t i = 0; i < param_map.size; ++i) {
        if (MsgpackHelpers::ensureKeyIsString(param_map.ptr->key) == paramIndex) {
            return true;
        }
    }
    return false;
}

// template <typename T>
// std::optional<T> EntityTemplate::GetParameterFromTemplatedEntity(Entity ent, std::string compName, std::string paramName) {
//     if(ParameterExists(ent,compName,paramName) == false) {
//         return std::nullopt;
//     }
//     //TODO!
// }
