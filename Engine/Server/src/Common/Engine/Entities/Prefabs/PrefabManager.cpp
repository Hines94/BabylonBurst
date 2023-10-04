#include "PrefabManager.h"
#include "Engine/Aws/AwsManager.h"
#include "Engine/SaveLoad/ComponentLoader.h"
#include "Engine/SaveLoad/EntityLoader.h"
#include "Prefab.hpp"
#include <msgpack.hpp>
#include <string>
#include <vector>

// Define the static Singleton pointer
std::unique_ptr<PrefabManager> PrefabManager::instance = nullptr;

void PrefabManager::RefreshPrefabs() {
    AwsManager::getInstance().GetAllObjectsInS3([this](std::vector<std::string> allItems) {
        //TODO: Fix this up and Instead search all bundles?
        const std::string prefabItemType = "~p~";
        std::vector<std::string> prefabItems;
        for (const auto& item : allItems) {
            if (item.find(prefabItemType) != std::string::npos) {
                prefabItems.push_back(item);
            }
        }
        prefabNameToUUID.clear();
        prefabsByUUID.clear();

        for (const auto& fileName : prefabItems) {
            this->filesAwaitingCallback.push_back(fileName);

            std::cout << "Checking for prefab in file: " << fileName << std::endl;

            AwsManager::getInstance().GetFilenamesOfBundle(fileName,
                                                           [fileName, this](std::vector<std::string> vec) {
                                                               const auto it = std::find(filesAwaitingCallback.begin(), filesAwaitingCallback.end(), fileName);
                                                               this->filesAwaitingCallback.erase(it);
                                                               this->checkFilenamesForPrefab(vec, fileName);
                                                           });
        }
    });
}

void PrefabManager::checkFilenamesForPrefab(std::vector<std::string> names, std::string mainPath) {
    for (const auto& n : names) {
        if (n.find(".Prefab") != std::string::npos) {
            this->prefabsAwaitingCallback.push_back(mainPath);
            AwsManager::getInstance().GetFileFromS3(mainPath, n,
                                                    [mainPath, n, this](std::vector<uint8_t> vec) {
                                                        SetupPrefabFromBinary(mainPath, n, vec);
                                                    });
        }
    }
}

Component* PrefabManager::TryGetDefaultPrefabComp(EntityData* ent, std::string Component) {
    if (Component == "Prefab") {
        //TODO: If no longer exists on prefab or prefab no longer exists then big problem
        return nullptr;
    }
    if (!ent) {
        return nullptr;
    }
    const auto PrefabComp = EntityComponentSystem::GetComponent<Prefab>(ent);
    if (!PrefabComp) {
        return nullptr;
    }
    //If not part of a instance then no defaults (we are in editor or something)
    if (!PrefabComp->InstanceOwner) {
        return nullptr;
    }

    //Get original prefab
    const auto prefabUUID = PrefabComp->PrefabIdentifier;
    const auto prefabIt = prefabsByUUID.find(prefabUUID);
    if (prefabIt == prefabsByUUID.end() || !prefabIt->second.get()->ComponentExists(PrefabComp->EntityIndex, Component)) {
        return nullptr;
    }

    //TODO: This map could be a problem??
    const std::map<Entity, EntityData*> dummyMap;
    return prefabIt->second.get()->GetComponentFromTemplatedEntity(PrefabComp->EntityIndex, Component, dummyMap);
}

std::string PrefabManager::SetupPrefabFromBinary(const std::string& prefabLocation, const std::string& prefabName, const std::vector<uint8_t>& prefabData) {
    bool validPrefabData = true;
    msgpack::object_handle oh;
    try {
        // Unpack the object
        oh = msgpack::unpack(reinterpret_cast<const char*>(prefabData.data()), prefabData.size());
    } catch (const std::exception& e) {
        std::cerr << "Prefab: " << prefabLocation << " has invalid data! " << e.what() << std::endl;
        return "";
    } catch (...) {
        std::cerr << "Prefab: " << prefabLocation << " has invalid data! " << std::endl;
        return "";
    }

    std::map<std::string, msgpack::object> decoded_map;
    try {
        oh.get().convert(decoded_map);
    } catch (...) {
        std::cerr << "Prefab: " << prefabLocation << " data is not map! " << std::endl;
        return "";
    }

    // Extract the desired data
    std::string prefabID;
    std::vector<uint8_t> extractedPrefabData;

    for (const auto& item : decoded_map) {
        if (item.first == "prefabID") {
            item.second.convert(prefabID);
        } else if (item.first == "prefabData") {
            item.second.convert(extractedPrefabData);
        }
    }

    if (prefabID == "") {
        std::cerr << "No prefab ID for prefab " << prefabLocation << std::endl;
        return "";
    }
    if (extractedPrefabData.empty()) {
        std::cerr << "No prefab Data for prefab " << prefabLocation << std::endl;
        return "";
    }

    //Existing prefab?
    if (prefabsByUUID.contains(prefabID)) {
#ifdef BBCLIENT
        prefabsByUUID.erase(prefabID);
#else
        prefabsByUUID.unsafe_erase(prefabID);
#endif

        //Find name and erase (in case of same name)
        if (prefabNameToUUID.contains(prefabLocation) && prefabNameToUUID[prefabLocation] == prefabID) {
#ifdef BBCLIENT
            prefabNameToUUID.erase(prefabLocation);
#else
            prefabNameToUUID.unsafe_erase(prefabLocation);
#endif
        } else {
            //Find name and erase (in case of name change)
            for (const auto& n : prefabNameToUUID) {
                if (n.second == prefabID) {
#ifdef BBCLIENT
                    prefabNameToUUID.erase(n.first);
#else
                    prefabNameToUUID.unsafe_erase(n.first);
#endif
                    break;
                }
            }
        }
    }

    const auto enttemplate = EntityLoader::LoadTemplateFromSave(extractedPrefabData);
    prefabNameToUUID.insert({std::string(prefabLocation) + prefabName, prefabID});
    prefabsByUUID.insert({prefabID, enttemplate});

    std::cout << "Loaded prefab: " << prefabID << " " << prefabLocation << " " << prefabName << std::endl;

    checkAllPrefabsLoaded(prefabLocation);

    return prefabID;
}

bool PrefabManager::SpawnPrefabComponents(PrefabInstance* instance, EntityData* instanceOwner) {
    const auto it = prefabsByUUID.find(instance->PrefabUUID);
    if (it == prefabsByUUID.end()) {
        return false;
    }
    const std::shared_ptr<EntityTemplate>& prefabTemplate = it->second;
    //Check if existing entity from save data
    std::map<uint, Prefab*> existingPrefabEntities;
    std::map<Entity, EntityData*> existingPrefabEntitiesMap;
    std::vector<EntityData*> RemovalEntities;
    for (const auto ent : instance->PrefabEntities) {
        //If entity no longer exists on our prefab then remove
        const auto existingPrefabComp = EntityComponentSystem::GetComponent<Prefab>(ent);
        const auto existingPrefabRelativeIndex = existingPrefabComp->EntityIndex;
        if (!prefabTemplate.get()->EntityExists(existingPrefabComp->EntityIndex)) {
            EntityComponentSystem::DelayedRemoveEntity(ent);
            RemovalEntities.push_back(ent);
            continue;
        }
        existingPrefabComp->InstanceOwner = instanceOwner;
        existingPrefabEntities.insert(std::make_pair(existingPrefabRelativeIndex, existingPrefabComp));
        existingPrefabEntitiesMap.insert(std::make_pair(existingPrefabRelativeIndex, ent));
    }

    //Entities that are no longer in prefab?
    if (RemovalEntities.size() != 0) {
        instance->PrefabEntities.erase(std::remove_if(instance->PrefabEntities.begin(), instance->PrefabEntities.end(),
                                                      [&RemovalEntities](EntityData* val) {
                                                          return std::find(RemovalEntities.begin(), RemovalEntities.end(), val) != RemovalEntities.end();
                                                      }),
                                       instance->PrefabEntities.end());
    }

    //Modify template to remove already created entities
    auto unsavedNewPrefabEntities = std::make_shared<EntityTemplate>();
    unsavedNewPrefabEntities.get()->numerisedComponents = prefabTemplate.get()->numerisedComponents;
    std::map<Entity, EntityData*> dummyEntities;
    for (const auto& ent : prefabTemplate.get()->templatedEntities) {
        //No prefab attached - passes automatically
        if (!prefabTemplate.get()->ComponentExists(ent.first, "Prefab")) {
            unsavedNewPrefabEntities.get()->templatedEntities.insert(ent);
            continue;
        }
        //Check if prefab index is already saved?
        Prefab* prefData = static_cast<Prefab*>(prefabTemplate.get()->GetComponentFromTemplatedEntity(ent.first, "Prefab", dummyEntities));
        if (!existingPrefabEntities.contains(prefData->EntityIndex)) {
            unsavedNewPrefabEntities.get()->templatedEntities.insert(ent);
        }
        delete (prefData);
    }

    auto loadedPrefabEntities = EntityLoader::LoadTemplateToNewEntities(unsavedNewPrefabEntities);
    //Setup freshly spawned entities
    for (const auto& e : loadedPrefabEntities) {
        const auto entPrefabComp = EntityComponentSystem::GetComponent<Prefab>(e.second);
        if (!entPrefabComp) {
            continue;
        }
        EntityComponentSystem::GetComponent<Prefab>(e.second)->InstanceOwner = instanceOwner;
        instance->PrefabEntities.push_back(e.second);
    }

    //Make map of all new entities for this prefab (including those with overriden values + fully default new ones)
    for (const auto& e : existingPrefabEntitiesMap) {
        if (loadedPrefabEntities.find(e.first) != loadedPrefabEntities.end()) {
            loadedPrefabEntities[e.first] = e.second;
        } else {
            loadedPrefabEntities.insert(e);
        }
    }

    //Add non saved components/params
    for (const auto ent : existingPrefabEntities) {
        const auto entData = existingPrefabEntitiesMap.find(ent.first)->second;
        const auto existingPrefabRelativeIndex = ent.second->EntityIndex;
        //Entity no longer exists on default?
        if (prefabTemplate.get()->templatedEntities.find(existingPrefabRelativeIndex) == prefabTemplate.get()->templatedEntities.end()) {
            continue;
        }
        //Check for each component that it has been added/set from default
        for (const auto& comp : prefabTemplate.get()->templatedEntities.find(existingPrefabRelativeIndex)->second) {
            const int compIndex = std::stoull(comp.first);
            const std::string compName = prefabTemplate.get()->GetComponentAsString(compIndex);
            //If existing component then copy values across
            const auto loadedComp = EntityComponentSystem::GetComponent(entData, ComponentLoader::GetComponentTypeFromName(compName));
            if (loadedComp) {
                //Load default values if blank
                loadedComp->LoadFromComponentDataIfDefault(loadedPrefabEntities, prefabTemplate.get()->GetComponentDataFromMsgpack(compIndex, comp.second, loadedPrefabEntities));
            } else {
                //Else simply add default component (no need to network since is fully default and client should also load)
                const auto defaultComp = prefabTemplate.get()->GetComponentFromTemplatedEntity(existingPrefabRelativeIndex, compName, loadedPrefabEntities);
                EntityComponentSystem::AddSetComponentToEntity(entData, defaultComp, false, true);
            }
        }
    }

    return true;
}

void PrefabManager::checkAllPrefabsLoaded(std::string prefab) {
    //Check and erase prefab from waiting
    const auto it = std::find(prefabsAwaitingCallback.begin(), prefabsAwaitingCallback.end(), prefab);
    if (it == prefabsAwaitingCallback.end()) {
        return;
    }
    prefabsAwaitingCallback.erase(it);
    //Call callback if loaded
    if (prefabsAwaitingCallback.size() != 0) {
        return;
    }
    onAllPrefabsLoaded.triggerEvent(this);
}

std::optional<std::pair<PrefabInstance*, EntityData*>> PrefabManager::LoadPrefabByUUID(const std::string& UUID) {
    const auto it = prefabsByUUID.find(UUID);
    if (it == prefabsByUUID.end()) {
        return std::nullopt;
    }
    auto instanceEntity = EntityComponentSystem::AddEntity();
    PrefabInstance* newInstance = new PrefabInstance();
    newInstance->PrefabUUID = UUID;
    EntityComponentSystem::AddSetComponentToEntity(instanceEntity, newInstance);
    return std::make_pair(newInstance, instanceEntity);
}

std::optional<std::shared_ptr<EntityTemplate>> PrefabManager::GetPrefabTemplateById(const std::string& UUID) {
    const auto it = prefabsByUUID.find(UUID);
    if (it == prefabsByUUID.end()) {
        return std::nullopt;
    }
    return prefabsByUUID.find(UUID)->second;
}

std::string ensureEndsWithPrefabSpec(std::string str) {
    const std::string suffix = "~p~.zip";
    if (str.size() < suffix.size() || str.substr(str.size() - suffix.size()) != suffix) {
        str += suffix;
    }
    return str;
}

std::string ensureEndsWithDotPrefab(std::string str) {
    const std::string suffix = ".Prefab";
    if (str.size() < suffix.size() || str.substr(str.size() - suffix.size()) != suffix) {
        str += suffix;
    }
    return str;
}

std::optional<std::pair<PrefabInstance*, EntityData*>> PrefabManager::LoadPrefabByName(const std::string& filePath, const std::string& prefabName) {
    const auto check = ensureEndsWithPrefabSpec(filePath) + ensureEndsWithDotPrefab(prefabName);
    const auto it = prefabNameToUUID.find(check);
    if (it == prefabNameToUUID.end()) {
        std::cerr << "Failed to get prefab for params: " << check << std::endl;
        return std::nullopt;
    }
    return LoadPrefabByUUID(it->second);
}
