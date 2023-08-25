#include "BuildableObject.h"
#include "SaveLoad/EntityLoader.h"
#include <iostream>
#include <msgpack.hpp>

struct ItemSetup {
    std::string Higherarch;
};

void from_json(const nlohmann::json& j, ItemSetup& p) {
    j.at("Higherarch").get_to(p.Higherarch);
}

std::map<Entity, EntityData*> BuildableObject::GenerateObjectCopy() {
    return EntityLoader::LoadTemplateToNewEntities(itemTemplate);
}

BuildableObject::BuildableObject(const std::string& itemName, const nlohmann::json data) {
    ItemID = itemName;

    for (auto it = data.begin(); it != data.end(); ++it) {
        std::string name = it.key();
        //If setup then unpack?
        if (name == "Higherarch") {
            SetupEntHigherarchy(it.value());
        }
    }
}

void BuildableObject::SetupEntHigherarchy(const nlohmann::json data) {
    std::vector<uint8_t> higherachMsg;
    data.get_to(higherachMsg);
    itemTemplate = EntityLoader::LoadTemplateFromSave(higherachMsg);
    auto loads = EntityLoader::LoadTemplateToNewEntities(itemTemplate);

    std::cout << "Loaded template: " << loads.size() << std::endl;
}

void BuildableObject::SetupHigherarch(const nlohmann::json data) {
    //Get readable format
    std::vector<uint8_t> msgpackData;
    for (const auto& el : data) {
        msgpackData.push_back(el.get<uint8_t>());
    }
    //TODO: Load template
}