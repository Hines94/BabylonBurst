#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Utils/Settings.h"
#include "Engine/Utils/ThreadPool.h"
#include "gtest/gtest.h"

//NOTE: GTEST GIVES ISSUES WITH RUNNING TBB PARALLEL FOR!
//WE CAN ONLY RUN GTEST IN PRODUCTION MODE DUE TO ASSERTION!

struct TestComp : public Component {
public:
    static int removedNum;
    static int addedNum;
    std::string val;

    void onComponentAdded(EntityData* entData) {
        addedNum++;
    }

    void onComponentRemoved(EntityData* entData) {
        removedNum++;
    }

    void GetComponentData(PackerDetails& p, bool ignoreDefaultValues, Component* childComp) {
    }

    void LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) {
    }

    void LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) {
    }
};

int TestComp::removedNum = 0;
int TestComp::addedNum = 0;

struct TestComp2 : public Component {
public:
    std::string val;

    void GetComponentData(PackerDetails& p, bool ignoreDefaultValues, Component* childComp) {
        if (p.Include("val", PackType::SaveAndNetwork, val == "")) {
            p.packer->pack(val);
        }
    }
    void LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) {
    }
    void LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) {
    }
};

struct TestMethods {
    const static int numThreads = 4;
    const static int numEntitiesPerCore = 10;
    const static int numGetLookupsPerCore = 10;
    const static int numAutoParallelTasks = 10;

    static int GetExpectedNumEntities() {
        return numThreads * numEntitiesPerCore;
    }

    static void addEntitiesParallel(int coreId) {
        for (int i = 0; i < numEntitiesPerCore; i++) {
            auto ent = EntityComponentSystem::AddEntity();
            EntityComponentSystem::AddSetComponentToEntity(ent, new TestComp());
            EntityComponentSystem::AddSetComponentToEntity(ent, new TestComp2());
        }
    }

    static void getEntitiesParallel(int coreId) {
        auto numRegular = GetExpectedNumEntities();
        for (int i = 0; i < numGetLookupsPerCore; i++) {
            std::vector<std::type_index> includeTypesAll = {typeid(TestComp)};
            std::vector<std::type_index> excludeTypesAll = {};
            auto allEntities = EntityComponentSystem::GetEntitiesWithData(includeTypesAll, excludeTypesAll);
            EXPECT_EQ(allEntities.get()->size(), numRegular + 1);
            std::vector<std::type_index> includeTypesAllBarOne = {typeid(TestComp), typeid(TestComp2)};
            std::vector<std::type_index> excludeTypesAllBarOne = {};
            auto allEntitiesBarOne = EntityComponentSystem::GetEntitiesWithData(includeTypesAllBarOne, excludeTypesAllBarOne);
            EXPECT_EQ(allEntitiesBarOne.get()->size(), numRegular);
            std::vector<std::type_index> includeTypesOne = {typeid(TestComp)};
            std::vector<std::type_index> excludeTypesOne = {typeid(TestComp2)};
            auto oneEntity = EntityComponentSystem::GetEntitiesWithData(includeTypesOne, excludeTypesOne);
            EXPECT_EQ(oneEntity.get()->size(), 1);
        }
    }

    static void changeEntitiesParallel(int coreId) {
        const int offset = (numEntitiesPerCore * coreId) + 1;
        for (int i = 0; i < numEntitiesPerCore; i++) {
            const int ent = offset + i;
            EntityData* ed = EntityComponentSystem::GetComponentDataForEntity(ent);
            EXPECT_NE(ed, nullptr);
            TestComp* tc = EntityComponentSystem::GetComponent<TestComp>(ed);
            std::unique_lock lock(tc->writeMutex);
            tc->val = "Changed";
        }
    }

    static void taskChangeEntitiesParallel(double dt, EntityData* ent) {
        auto testComp = EntityComponentSystem::GetComponent<TestComp>(ent);
        std::unique_lock lock(testComp->writeMutex);
        testComp->val = "parallelTask";
    }

    static void taskRemoveCompParallel(double dt, EntityData* ent) {
        EntityComponentSystem::DelayedRemoveComponent<TestComp>(ent);
    }

    static void taskDeleteParallel(double dt, EntityData* ent) {
        EntityComponentSystem::DelayedRemoveEntity(ent);
    }

    static void printRunTime(std::chrono::system_clock::time_point start, std::string testName) {
        auto currentTime = std::chrono::system_clock::now();
        auto deltaTime = std::chrono::duration<double>(currentTime - start).count();
        std::cout << "Runtime for " << testName << ": " << deltaTime << " seconds" << std::endl;
    }
};

//Test parallel adding of entities
TEST(EntitiesTest, ParallelAddEntities) {
    //Settings::getInstance().inTesting = true;
    //Setup
    EntityComponentSystem::SetupEntitySystem();

    auto startTime = std::chrono::system_clock::now();

    TestMethods testRunner;
    EntityComponentSystem::SetParallelMode(TestMethods::numThreads > 1);
    ThreadPool::testRunParallel(TestMethods::numThreads, TestMethods::addEntitiesParallel);
    EntityComponentSystem::SetParallelMode(false);
    EntityComponentSystem::FlushEntitySystem();

    //Check our entities have been created
    TestMethods::printRunTime(startTime, "Add Entities");

    //Check entities exist
    EXPECT_EQ(TestMethods::GetExpectedNumEntities(), EntityComponentSystem::GetNumberEntitiesSpawned());
    EXPECT_EQ(EntityComponentSystem::DoesEntityExist(1), true);
    EXPECT_EQ(EntityComponentSystem::DoesEntityExist(TestMethods::GetExpectedNumEntities() + 100), false);
    EXPECT_NE(TestComp::addedNum, 0);
}

//Test parallel changing of comp data
TEST(EntitiesTest, ParallelChangeData) {
    auto startTime = std::chrono::system_clock::now();
    TestMethods testRunner;

    EntityComponentSystem::SetParallelMode(TestMethods::numThreads > 1);
    ThreadPool::testRunParallel(TestMethods::numThreads, TestMethods::changeEntitiesParallel);
    EntityComponentSystem::SetParallelMode(false);

    //Check our entities have been changed
    TestMethods::printRunTime(startTime, "Change Data");

    auto randData = EntityComponentSystem::GetComponent<TestComp>(EntityComponentSystem::GetComponentDataForEntity(2));
    EXPECT_EQ(randData->val, "Changed");

    EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
}

//Check parallel get entities
TEST(EntitiesTest, ParallelGetEntities) {
    //Add an extra entitiy with only one type
    auto newEnt = EntityComponentSystem::AddEntity();
    EntityComponentSystem::AddSetComponentToEntity(newEnt, new TestComp());
    EntityComponentSystem::FlushEntitySystem();
    auto startTime = std::chrono::system_clock::now();
    TestMethods testRunner;

    //Note: This is doing a lot of work - It is running numGet*numCores so it may be slightly slower than others!
    EntityComponentSystem::SetParallelMode(TestMethods::numThreads > 1);
    ThreadPool::testRunParallel(TestMethods::numThreads, TestMethods::getEntitiesParallel);
    EntityComponentSystem::SetParallelMode(false);

    //Check our entities have been changed
    TestMethods::printRunTime(startTime, "Parallel Get Entities");

    EntityComponentSystem::SetParallelMode(false);
    startTime = std::chrono::system_clock::now();
    for (int i = 0; i < TestMethods::numThreads; i++) {
        TestMethods::getEntitiesParallel(0);
    }
    TestMethods::printRunTime(startTime, "Series Get Entities");
}

//Check parallel EntityUtils method on query
TEST(EntitiesTest, ParallelAutoMethod) {
    TestMethods testRunner;
    auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
    auto startTime = std::chrono::system_clock::now();
    for (int i = 0; i < TestMethods::numAutoParallelTasks; i++) {
        EntityTaskRunners::AutoPerformTasksParallel("TestChange", allEnts, TestMethods::taskChangeEntitiesParallel, 0.0);
    }
    TestMethods::printRunTime(startTime, "Auto Parallel Method");

    auto randData = EntityComponentSystem::GetComponent<TestComp>(EntityComponentSystem::GetComponentDataForEntity(3));
    EXPECT_EQ(randData->val, "parallelTask");
}

//Test parallel delayed removing of entities
TEST(EntitiesTest, ParallelDelayedRemove) {
    //Run comp removal
    TestMethods testRunner;
    auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
    int resizeSize = TestMethods::numEntitiesPerCore / 2;
    auto resized = allEnts.get()->GetLimitedNumber(resizeSize);
    auto startTime = std::chrono::system_clock::now();
    EntityTaskRunners::AutoPerformTasksParallel<EntityData>("TestRemove", resized, TestMethods::taskRemoveCompParallel, 0.0);
    EntityComponentSystem::FlushEntitySystem();
    TestMethods::printRunTime(startTime, "Delayed remove");

    //Check comps have been removed
    auto newEnts = EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
    EXPECT_EQ(newEnts.get()->size(), TestMethods::GetExpectedNumEntities() - resizeSize + 1);
    //Check onComponentRemoved method works
    EXPECT_NE(TestComp::removedNum, 0);
}

//Test parallel delayed removing of entities
TEST(EntitiesTest, ParallelDelayedDelete) {
    //Delete some entities and check
    TestMethods testRunner;
    int resizeSize = TestMethods::numEntitiesPerCore / 2;
    auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
    auto resized = allEnts.get()->GetLimitedNumber(resizeSize);

    auto startTime = std::chrono::system_clock::now();

    EntityTaskRunners::AutoPerformTasksParallel<EntityData>("TestDelete", resized, TestMethods::taskDeleteParallel, 0.0);
    EntityComponentSystem::FlushEntitySystem();

    TestMethods::printRunTime(startTime, "Delayed Delete");

    auto newEnts = EntityComponentSystem::GetEntitiesWithData({typeid(TestComp)}, {});
    EXPECT_EQ(newEnts.get()->size(), TestMethods::GetExpectedNumEntities() - (resizeSize * 2) + 1);
}

TEST(EntitiesTest, EnsureEntity) {
    EntityComponentSystem::EnsureEntity(101);
    EntityComponentSystem::FlushEntitySystem();
    EXPECT_NE(EntityComponentSystem::GetComponentDataForEntity(101), nullptr);
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 101);
}

//Reset at end in case any specific modules use ecs
TEST(EntitiesTest, ResetECSS) {
    EXPECT_NE(EntityComponentSystem::GetEntitiesWithData({}, {}).get()->size(), 0);
    EntityComponentSystem::FlushEntitySystem();
    EntityComponentSystem::ResetEntitySystem();
    EXPECT_EQ(EntityComponentSystem::GetEntitiesWithData({}, {}).get()->size(), 0);
}