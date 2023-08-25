#pragma once
#include "Entities/EntitySystem.h"
#include "EntityTemplate.h"
#include <map>
#include <msgpack.hpp>
#include <stdexcept>

//Allows entity loading from a msgpack buffer
namespace EntityLoader {
    //From msgpack data, get numerised component keys
    std::vector<std::pair<std::string, std::vector<std::string>>> GetNumerisedComponentKeys(const msgpack::object& obj);

    //Get template which we can then populate from in the future
    std::shared_ptr<EntityTemplate> GetTemplateFromMsgpackFormat(const std::vector<std::pair<std::string, std::vector<std::string>>>& compKeys, const msgpack::object& obj);

    //Create FRESH new entities and maintain the relationships
    std::map<Entity, EntityData*> LoadTemplateToNewEntities(const std::shared_ptr<EntityTemplate> Template);

    //Load into existing entities - will add components
    std::map<Entity, EntityData*> LoadTemplateToExistingEntities(const std::shared_ptr<EntityTemplate> Template, bool overwrite);

    //Load from a previous EntitySaver::GetFullSavePack
    std::shared_ptr<EntityTemplate> LoadTemplateFromSave(const std::vector<uint8_t>& vec);
    std::shared_ptr<EntityTemplate> LoadTemplateFromSave(const std::string& vec);
} // namespace EntityLoader