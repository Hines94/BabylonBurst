
[< Home](/)

# Coding Quickstart
Code readability and ease has been prioritised in BabylonBurst. The idea is that the ECS syntax should be obvious and minimal. Additional client functionality and editor functionality should also be easy to implement via hooks and the [ecosystem](ecosystemOverview.md).

## Cpp Coding
The idea is that hopefully we maintain simple and easy to follow syntax even for those that are not experienced c++ developers. Each component and custom property can easily be specified using the CCOMPONENT and CPROPERTY tags along with simple calls for saving and loading data.
The only gotcha with this system is that while iterating through a system unless EntityComponentSystem::FlushSystem() is called (note dangerous when working in parallel) then some data on exact entity types could be outdated.
```cpp
#include "Engine/Entities/EntitySystem.h"

REQUIRE_OTHER_COMPONENTS(EntTransform) //For the editor to know EntTransform is required
CCOMPONENT(NOTYPINGS) //Custom component that will not generate client typings
//A basic component that has some custom properties (CPROPERTY)
struct myComponent : public Component {
    //REQUIRED:
    DECLARE_COMPONENT_METHODS(myComponent)

    //This property will auto have networking and saving capability. No typings will be generated for client side.
    CPROPERTY(int, someProperty, NO_DEFAULT, NET, SAVE, NOTYPINGS)

    //Regular property that is not saved, networked or typed
    float otherProperty;
}

void CreateEntityAddComponent() {
    auto myEnt = EntityComponentSystem::AddEntity();
    auto newComp = new MyComponent();
    EntityComponentSystem::AddSetComponentToEntity(myEnt,newComp);
}

//Manually update our system
updateSystem(systemInit, deltaTime, TestSystem::UpdateTestSystem, "TestMain");
//Register our system to be automatically updated in the middle of our game loop
#include "Engine/GameLoop/CommonGameLoop.h"
REGISTER_MIDDLE_SYSTEM_UPDATE(testSystem, TestSystem::UpdateTestSystem, -1)

void UpdateTestSystem(bool alreadyInit, double deltaTime) {
    //Rapidly find entities with our component
    auto ourEntities = EntityComponentSystem::GetEntitiesWithData({typeid(myComponent)}, {});
    ourEntities.get()->AddChangedOnlyQuery_Any(); //Only entities with data changed this frame will be run

    //This will run 'myTask' for each entity (and will be tracked in perf)
    EntityTaskRunners::AutoPerformTasksParallel("myTask", ourEntities , myTask, deltaTime);

    //We already know that myComponent is present due to get request
    void myTask(double dt, EntityData* ent) {
        //Change data
        auto ourComp = EntityComponentSystem::GetComponent<myComponent>(ent);
        //Lock just in case 
        std::shared_lock lock(ourComp->writeMutex);
        ourComp.someProperty = 10; //Change is automatically tracked so we can tell later this frame comp is changed

        //(Optional) network down data changes
        EntityComponentSystem::MarkCompToNetwork<myComponent>(ent);
    }
}

void SaveEntities() {
    //Get basic savepack
    auto save = EntitySaver::GetFullSavePack();

    //Load data
    std::vector<uint8_t> vec(save->data(), save->data() + save->size());
    auto saveTemplate = EntityLoader::LoadTemplateFromSave(vec);
    //Generate new entities with the data from originals (preserves entity relationships within save)
    EntityLoader::LoadTemplateToNewEntities(saveTemplate);
    //Write data into the original entities
    EntityLoader::LoadTemplateToExistingEntities(saveTemplate);
}

void RemoveEntity() {
    //Manually find our Entitiy data as we know ent id
    auto myEntity = EntityComponentSystem::GetComponentDataForEntity(1);

    //Remove our new component
    EntityComponentSystem::DelayedRemoveComponent(myEntity,EntityComponentSystem::GetComponent<myComponent>(myEntity));
    //Note: This will run after the current system is finished

    //Remove entity entirely
    EntityComponentSytem::DelayedRemoveEntity(myEntity);
    //Note: This will run after the current system is finished
}

```

## Typescript Coding
The idea here is to provide access to the running Ecosystem and enough hooks that the user never needs to leave the Source folder.
```ts
import { encode } from "msgpack.hpp"
import { EntTransform } from "@engine/EntitySystem/CoreComponents";
import { MessageToServType, serverConnection } from "@engine/Networking/ServerConnection";

// UpdateTick function REQUIRED in Source/TsSource/main.ts
export function UpdateTick(ecosystem:GameEcosystem) {
    //Create new box mesh for babylon
    MeshBuilder.createBox("testBox",ecosystem.scene);
    //Get data from ECS for components
    const transformEnts = ecosystem.wasmWrapper.GetEntitiesWithData([EntTransform],[]);
    const entities = Object.keys(transformEnts);
    entities.foreach((e)=>{
        const entId = parseInt(e)l;
        console.log("Components for entity: " + JSON.stringify(transformEnts[entId]));
    })
    //Send inputs from player to server
    SendDataToServer(ecosystem);
}

export function SendDataToServer(ecosystem: GameEcosystem) {
    //Send payload to server with custom data
    serverConnection.SendMessageToServer(encode(ThisFrameServerData), MessageToServType.inputs);
}

```