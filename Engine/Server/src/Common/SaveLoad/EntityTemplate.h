#pragma once
#include "Entities/EntitySystem.h"
#include <map>
#include <msgpack.hpp>

//Stores details on a group of entities. Can be re-loaded into new or existing entitiy ID's. Preserves EntityId references.
struct EntityTemplate {
    //Map to convert our components/params into
    std::vector<std::pair<std::string, std::vector<std::string>>> numerisedComponents;
    //Map to store templated entities which we can later populate as original or copy to new
    std::map<Entity, std::map<std::string, msgpack::object>> templatedEntities;
    //Handle that we used to unpack
    msgpack::object_handle masterHandle;

    //If we want to get a little information about our templated entity ahead of spawn
    // template <typename T>
    // std::optional<T> GetParameterFromTemplatedEntity(Entity ent, std::string compName, std::string paramName);

    Component* GetComponentFromTemplatedEntity(Entity ent, std::string compName, const std::map<Entity, EntityData*>& NewEntities);
    Component* GetComponentFromTemplatedEntity(Entity ent, int compIndex, const std::map<Entity, EntityData*>& NewEntities);

    bool EntityExists(Entity ent);
    bool ComponentExists(Entity ent, std::string compName);
    bool ComponentExists(Entity ent, int compIndex);
    bool ParameterExists(Entity ent, std::string compName, std::string paramName);

    std::map<std::string, msgpack::object> GetComponentDataFromMsgpack(size_t compId, const msgpack::object& data, const std::map<Entity, EntityData*>& entMapping);

    //In our template - what is the index of a component from its name (as data stored with indexes to save space)
    int GetComponentAsIndex(std::string compName) {
        int ind = 0;
        for (auto c : numerisedComponents) {
            if (c.first == compName) {
                return ind;
            }
            ind++;
        }
        return -1;
    }

    //In our template - what is the name of a component from its index (as data stored with indexes to save space)
    std::string GetComponentAsString(int index) {
        return numerisedComponents[index].first;
    }

    //In our template - what is the index of a component from its name (as data stored with indexes to save space)
    int GetParameterAsIndex(int compIndex, std::string paramName) {
        int ind = 0;
        for (auto p : numerisedComponents.at(compIndex).second) {
            if (p == paramName) {
                return ind;
            }
            ind++;
        }
        return -1;
    }

private:
    Component* unpackComponentIndividual(size_t compId, const msgpack::object& data, const std::map<Entity, EntityData*>& entMapping);
};