#pragma once
#include "Entities/EntitySystem.h"
#include <nlohmann/json.hpp>
#include <string>

class EntityTemplate;

struct BuildableObject {
    std::string ItemID;
    //Vector of entities and contained comps to generate a new build item from
    std::vector<std::vector<Component*>> HigherarchData;

    //Based from the item template saved in the buildables json
    std::map<Entity, EntityData*> GenerateObjectCopy();

    BuildableObject(const std::string& itemName, const nlohmann::json data);

private:
    void SetupEntHigherarchy(const nlohmann::json data);
    void SetupHigherarch(const nlohmann::json data);

    //Template that can be used to load our items at runtime
    std::shared_ptr<EntityTemplate> itemTemplate;
};