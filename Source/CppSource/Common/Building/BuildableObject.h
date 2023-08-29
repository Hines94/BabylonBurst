#pragma once
#include "Engine/Entities/EntitySystem.h"
#include <nlohmann/json.hpp>
#include <string>

class EntityTemplate;

struct BuildableObject {
    std::string ItemID;
    //Vec of ents and comps to create
    std::vector<std::vector<Component*>> HigherarchData;

    std::map<Entity, EntityData*> GenerateObjectCopy();

    BuildableObject(const std::string& itemName, const nlohmann::json data);

private:
    void SetupEntHigherarchy(const nlohmann::json data);
    void SetupHigherarch(const nlohmann::json data);

    std::shared_ptr<EntityTemplate> itemTemplate;
};