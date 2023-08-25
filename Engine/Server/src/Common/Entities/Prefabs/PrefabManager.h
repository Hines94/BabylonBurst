#pragma once
#include "PrefabInstance.h"
#include "SaveLoad/EntityTemplate.h"
#include "StorageTypes.hpp"
#include "Utils/Observable.hpp"
#include <memory>
#include <mutex>

//Responsible for keeping track of all Prefabs and loading them into ecs
class PrefabManager {
public:
    // Deleting the copy constructor and the assignment operator.
    PrefabManager(const PrefabManager&) = delete;
    PrefabManager& operator=(const PrefabManager&) = delete;

    static PrefabManager& getInstance() {
        static std::once_flag onceFlag;
        std::call_once(onceFlag, []() {
            instance.reset(new PrefabManager);
        });
        return *(instance.get());
    }

    std::optional<std::pair<PrefabInstance*, EntityData*>> LoadPrefabByUUID(const std::string& UUID);
    std::optional<std::pair<PrefabInstance*, EntityData*>> LoadPrefabByName(const std::string& Name);

    //Reload from S3 all prefabs
    void RefreshPrefabs();

    //For networking/saving so we are not sending unneccesary data. Looks for Prefab component and gets original prefab from there
    Component* TryGetDefaultPrefabComp(EntityData* ent, std::string Component);

    //Returns UUID - NOTE: Not safe for parallel
    std::string SetupPrefabFromBinary(const std::string& prefabLocation, const std::vector<uint8_t>& prefabData);

    //Should ONLY be called by prefab Instance
    bool SpawnPrefabComponents(PrefabInstance* instance, EntityData* instanceOwner);

    //Useful for async situations, such as in WASM where we use callbacks
    Observable<PrefabManager*> onAllPrefabsLoaded;

private:
    PrefabManager() {} // Private constructor
    static std::unique_ptr<PrefabManager> instance;

    std::vector<std::string> prefabsAwaitingCallback;
    void checkAllPrefabsLoaded(std::string prefab);

    EntityUnorderedMap<std::string, std::shared_ptr<EntityTemplate>> prefabsByUUID;
    EntityUnorderedMap<std::string, std::string> prefabNameToUUID;

    std::optional<std::pair<PrefabInstance*, EntityData*>> LoadPrefab(std::shared_ptr<EntityTemplate> prefabTemplate);
};