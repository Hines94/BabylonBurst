#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/Prefabs/PrefabManager.h"
#include "Engine/Rendering/InstancedRender.hpp"
#include "Engine/SaveLoad/EntityLoader.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include "gtest/gtest.h"
#include <string>

//TODO: Fix this test
const std::string prefabData = "82a87072656661624944d92464653635656534372d333261302d346436622d626639312d306132303035366237636430aa70726566616244617461c5011382a1549392a650726566616292b05072656661624964656e746966696572ab456e74697479496e64657892ac456e745472616e73666f726d93a8506f736974696f6ea8526f746174696f6ea55363616c6592af496e7374616e63656452656e64657292a741777350617468a84d6573684e616d65a1439282a14f01a14381008200d92464653635656534372d333261302d346436622d626639312d306132303035366237636430010182a14f02a1438301810083a158cabe52e50ea159ca3ea5a87aa15a00028200b46275696c64696e672f426173696353686170657301a9426173696343756265008200d92464653635656534372d333261302d346436622d626639312d3061323030353662376364300102";

std::vector<uint8_t> hexStringToBytes(const std::string& hex) {
    std::vector<uint8_t> bytes;

    for (unsigned int i = 0; i < hex.length(); i += 2) {
        std::string byteString = hex.substr(i, 2);
        uint8_t byte = (uint8_t)strtol(byteString.c_str(), NULL, 16);
        bytes.push_back(byte);
    }

    return bytes;
}

//Test parallel adding of entities
TEST(PrefabsTest, ParallelAddPrefabs) {
    //TODO: Test parallel
    EntityComponentSystem::ResetEntitySystem();
    const auto prefabUUID = PrefabManager::getInstance().SetupPrefabFromBinary("TestPrefab", hexStringToBytes(prefabData));
    EXPECT_EQ(prefabUUID, "de65ee47-32a0-4d6b-bf91-0a20056b7cd0");
    const auto instanceItem = PrefabManager::getInstance().LoadPrefabByUUID(prefabUUID);
    EXPECT_NE(instanceItem, std::nullopt);
    //Should be 2 from the prefab plus the prefab instance parent
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 3);
}

TEST(PrefabsTest, DeletePrefab) {
    EntityComponentSystem::ResetEntitySystem();
    const auto prefabUUID = PrefabManager::getInstance().SetupPrefabFromBinary("TestPrefab", hexStringToBytes(prefabData));
    const auto instanceItem = PrefabManager::getInstance().LoadPrefabByUUID(prefabUUID);
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 3);

    //Should remove prefab instance entitites with instance item
    EntityComponentSystem::DelayedRemoveEntity(instanceItem->second);
    EntityComponentSystem::FlushEntitySystem();
    EXPECT_EQ(EntityComponentSystem::GetNumberActiveEntities(), 0);
}

//We want to ensure that we are not creating additional entities when we make an instance
//(eg load prefab + generate new entities with same prefab item 1 + new prefab 1 )
TEST(PrefabsTest, ReSaveLoadPrefab) {
    EntityComponentSystem::ResetEntitySystem();
    const auto prefabUUID = PrefabManager::getInstance().SetupPrefabFromBinary("TestPrefab", hexStringToBytes(prefabData));
    const auto instanceItem = PrefabManager::getInstance().LoadPrefabByUUID(prefabUUID);
    EntityComponentSystem::FlushEntitySystem();

    auto save = EntitySaver::GetFullSavePack();
    std::vector<uint8_t> vec(save->data(), save->data() + save->size());
    auto saveTemplate = EntityLoader::LoadTemplateFromSave(vec);
    EntityComponentSystem::ResetEntitySystem();
    //Expect not to save EntTransform or InstancedRender since have default values
    EXPECT_EQ(true, saveTemplate.get()->ComponentExists(3, "Prefab"));
    EXPECT_EQ(false, saveTemplate.get()->ComponentExists(3, "EntTransform"));
    EXPECT_EQ(false, saveTemplate.get()->ComponentExists(3, "InstancedRender"));

    EntityLoader::LoadTemplateToNewEntities(saveTemplate);
    EntityComponentSystem::FlushEntitySystem();
    const auto prefabInstancedRender = EntityComponentSystem::GetEntitiesWithData({typeid(InstancedRender)}, {}).get()->GetLimitedNumber(1)[0];
    //Check entities spawned
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 3);
    EXPECT_EQ(EntityComponentSystem::GetNumberActiveEntities(), 3);
    //Check default prefab data loaded
    EXPECT_EQ(EntityComponentSystem::GetComponent<InstancedRender>(prefabInstancedRender)->ModelData.MeshName, "BasicCube");
}

TEST(PrefabsTest, SaveNonDefaultValueChanges) {
    //Change value
    const auto prefabInstanceEnt = EntityComponentSystem::GetEntitiesWithData({typeid(InstancedRender)}, {}).get()->GetLimitedNumber(1)[0];
    EntityComponentSystem::GetComponent<InstancedRender>(prefabInstanceEnt)->ModelData.MeshName = "Test";

    //Check that save preserves non default value
    auto save = EntitySaver::GetFullSavePack();
    std::vector<uint8_t> vec(save->data(), save->data() + save->size());
    auto saveTemplate = EntityLoader::LoadTemplateFromSave(vec);
    EXPECT_EQ(true, saveTemplate.get()->ComponentExists(3, "InstancedRender"));

    //Re-load
    EntityComponentSystem::ResetEntitySystem();
    EntityLoader::LoadTemplateToNewEntities(saveTemplate);
    EntityComponentSystem::FlushEntitySystem();
    const auto instRend = EntityComponentSystem::GetComponent<InstancedRender>(EntityComponentSystem::GetComponentDataForEntity(3));
    //Overriden value should be changed
    EXPECT_EQ("Test", instRend->ModelData.MeshName);
    //Default values should also be set
    EXPECT_EQ("building/BasicShapes", instRend->ModelData.FilePath);
}