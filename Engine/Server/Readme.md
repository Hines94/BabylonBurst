# Space Fleets Server
This server is built in C++ with a ECS structure to maximise performance and enable use of existing libraries such as Bullet Physics for game development. It integrates easily with the client side version and typescript/babylon JS.

## Editing
Use the WSL extension for vscode to work in an Ubuntu distro. This will allow easy working & testing in the correct environment rather than a dodgy windows half build.

## Setup
- Run WslSetup.bat if WSL not installed (and add hyperV in bios if required)
- Install VSCode & WSL extension
- Run DevSetup.sh in wsl
- Make sure that AWS credentials are set for WSL
    - Set using nano to make it easy to use every time (nano ~/.bashrc, add export MY_VARIABLE=my_value, source ~/.bashrc)

## Run Debug Local
- Change any settings in .env
- VSCode: Run->StartDebugging
- Tests: bash BuildDev.sh -t or Start Debugging in "Test" mode

## Basic Examples
``` cpp

REQUIRE_OTHER_COMPONENTS(EntTransform)
CCOMPONENT(NOTYPINGS) //Custom component that will not generate client typings
//A basic component that has some custom properties (CPROPERTY)
struct myComponent : public Component {
    DECLARE_COMPONENT_METHODS(myComponent)

    //This property will auto have networking and saving capability. No typings will be generated for client side.
    CPROPERTY(NET,SAVE,NOTYPINGS)
    int someProperty;
}

void CreateEntityAddComponent() {
    auto myEnt = EntityComponentSystem::AddEntity();
    auto newComp = new MyComponent();
    EntityComponentSystem::AddSetComponentToEntity(myEnt,newComp);
}

//Note: Systems can be run with updateSystem (and will be perf tracked)
updateSystem(systemInit, deltaTime, TestSystem::UpdateTestSystem, "TestMain");

void UpdateTestSystem(bool alreadyInit, double deltaTime) {
    //Rapidly find entities with our component
    auto ourEntities = EntityComponentSystem::GetEntitiesWithData({typeid(myComponent)}, {});

    //Get only those entities where myComponent has changed already this frame
    ourEntities.get().AddChangedOnlyQuery_Any();

    //This will run 'myTask' for each entity (and will be tracked in perf)
    EntityTaskRunners::AutoPerformTasksParallel("myTask", ourEntities , myTask, deltaTime);

    //We already know that myComponent is present due to get request
    void myTask(double dt, EntityData* ent) {
        //Change data
        auto ourComp = EntityComponentSystem::GetComponent<myComponent>(ent);
        //Lock just in case 
        std::shared_lock lock(ourComp->writeMutex);
        ourComp.someProperty = 10;

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
    //Populate world with saved data
    EntityLoader::LoadTemplateToNewEntities(saveTemplate);
}

void RemoveEntity() {
    //Manually find our Entitiy data as we know ent id
    auto myEntity = EntityComponentSystem::GetComponentDataForEntity(1);

    //Remove our new component
    EntityComponentSystem::DelayedRemoveComponent(myEntity,EntityComponentSystem::GetComponent<myComponent>(myEntity));

    //Remove entity entirely
    EntityComponentSytem::DelayedRemoveEntity(myEntity);
    //Note: This will run after the current system is finished
}

```


## Background
This server uses a 'light' Entity Component System (ECS) architecture to help with parallelisation, syncing data to our clients and also code readability. Entities are auto sorted into "buckets" for near-instant retrieval via query. Option to perform parallel or sequential tasks via EntityTaskRunners::AutoPerformTasksParallel/AutoPerformTasksSeries. Parallel is better option 99% of the time. It does not make the most of memory layout, but given the parallelistation and other benefits this actually amounts to a small impact.

## Autogeneration
Autogeneration is performed via a node script in the Tools/Autogeneration folder. It runs in under 1 sec for even large codebases. It saves data only if changed - therefore, prevents unneccessary recompiles. It could be improved for speed by multithreading.

- Specifying networked/saved properties on components in a clean/easy way
- Mapping components to their names for loading & saving
- Generating client side (typescript) typings (compatible with Editor)
    - Properties only added if marked with "Save"
    - If "NoTypings" then will not add property / component typings

This could be expanded to other tasks in the future to reduce redundant code.

## Performance
- Performance is auto tracked to Prometheus
- Each parallel task is tracked
- Each system overall is tracked
- Data out is tracked (to check for spikes & cost implications)
- Cpu and Memory basic stats tracked

## Networking
Networking is rate limited (to avoid 250 messages/sec)! The default rate is 12 ticks. Components marked tonetwork will auto be networked, as long as their properties are marked with a CPROPERTY(NET).

- Json is used for messages client->server (convenience)
- MsgPack is used for messages server->client (size & speed)
- Compression is used for server->client (deflate - not the best but easy to implement)

### Prefabs & Networking
- Prefab default setups detected and variables compared
    - If different then networked
    - If exactly the same then only Prefab Root networked with id of prefab to be auto loaded

### Non Prefab
- Components compared to default
    - If not different then networked with blank param for default creation
    - If params are different they are networked