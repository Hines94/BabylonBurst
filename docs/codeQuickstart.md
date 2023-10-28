
[< Home](/)

# Coding Quickstart
Code readability and ease has been prioritised in BabylonBurst. The idea is that the ECS syntax should be obvious and minimal. Additional client functionality and editor functionality should also be easy to implement via hooks and the [ecosystem](ecosystemOverview.md).

## Coding
The idea here is to give the user everything they need within the Ecosystem. Therefore, we can do things like adding/removing entities from the ecosystem and in particular the EntitySystem.


### Entity Basics
```ts
import { encode } from "msgpack.hpp"
import { EntTransform } from "@engine/EntitySystem/CoreComponents";
import { MessageToServType, serverConnection } from "@engine/Networking/ServerConnection";
import { InstancedRender } from "@engine/Rendering/InstancedRender"
import { PrefabManager } from "@engine/EntitySystem/PrefabManager";

function CreateNewEntity(ecosystem: GameEcosystem) {
    const newEntity =  ecosystem.entitySystem.AddEntity();
    const renderer = new InstancedRender();
    //Setup a model etc here for the render to use
    //EntTransform will automatically be added as it is required by InstancedRender
    ecosystem.entitySystem.AddSetComponentToEntity(newEntity,renderer);
}

function IterateEntites(ecosystem: GameEcosystem) {
    //Get data from ECS for components
    const transformEnts = ecosystem.entitySystem.GetEntitiesWithData([EntTransform],[]);
    
    //Easily iterate with built in method
    transformEnts.IterateEntities(e=>{
        console.log(e);
        const transformData = e.GetComponent(EntTransform);
    })

    //Alternatively for loop them
    const entitiesArray = transformEnts.GetEntitiesArray();
    for(var e = 0; e < entitiesArray.length;e++) {
        const ent = entitiesArray[e];
    }
}

function FilterEntities(ecosystem:GameEcosystem) {
    //Exclude those with instanced render
    const transformEnts = ecosystem.entitySystem.GetEntitiesWithData([EntTransform],[InstancedRender]);
    //Get only those with changed components?
    transformEnts.AddChanged_ALL_Filter();

    //Add custom filter
    transformEnts.filters.push((ent:EntityData,filter:EntityQuery) => {
        //Exclude entity 5 as its special?
        if(ent.EntityId === 5) {
            return false;
        }
        return true;
    });
}

```


### Prefabs

```ts
function LoadPrefabs(ecosystem:GameEcosystem) {
    //Load into fresh entities
    const id = PrefabManager.GetIdFromBundleFileName("someZippedBundle","someNamedPrefabInside");
    if(id) {
        PrefabManager.LoadPrefabFromIdToNew(id,ecosystem.entitySystem);
    }
    //Load into existing entities
    PrefabManager.LoadPrefabFromIdToExisting("KnownPrefabUUID-asgfena12312bjsjkajge",ecosystem.entitySystem);
}
```


### Saving/Loading
```ts
function SaveLoadEntities(ecosystem:GameEcosystem) {
    const desiredSaveEntities = ecosystem.entitySystem.GetEntitiesWithData([DesiredComponent],[]);

    //If ignore defaults then will not waste save data on items the same as default values
    const uintData = EntitySaver.GetMsgpackForQuery(desiredSaveEntities,true);

    //First load into a 'template' which will allow multiple loads and inspection of the data
    const reloadTemplate = EntityLoader.GetEntityTemplateFromMsgpack(uintData);
    //Next load that template into either new or existing entities
    EntityLoader.LoadTemplateIntoNewEntities(reloadTemplate,entSystem);
}
```

### Components

```ts
//REQUIRED: Make sure that the file containing your component is included (TODO: Remove the need for this?)

@RegisteredType(TestComp3,{RequiredComponents:[EntTransform],comment:"An example comp that can be used in Editor and Game!"})
class ExampleComponent extends Component {

    //Specify the type in the @Saved
    @Saved(String)
    data = "testComp3";

    //Use custom object to specify options
    @Saved(nestedData,{comment:"Nested within the example component"})
    nestData = new nestedData();

    //REQUIRED: For arrays make sure you init to [] (TODO: Remove the need for this?)
    @Saved(EntityData,{})
    testArray:EntityData[] = [];
}

ecosystem.AddSetComponentToEntity(someEntity,new ExampleComponent());
ecosystem.GetEntitiesWithData([ExampleComponent],[]);

```

### Systems 
Systems have custom performance tracking and can be easily enabled/disabled. They are generally preferred over using on tick. Engine systems can be altered and tailored by changing the RunSystem method on the instance.
```ts
import { GetSystemOfType() } from "@engine/GameLoop/GameSystemLoop"

//REQUIRED: Make sure that the file containing your system is included (TODO: Remove the need for this?)
class someSystem extends GameSystem {
    //Lower run earlier in the system stack
    SystemOrdering = -10;

    RunSystem(ecosystem: GameEcosystem) {
    }
}

//easily register the system
new someSystem();

//Alter the engine default instance rendering system
const defaultInstanceRenderer = GetSystemOfType(InstancedMeshRenderSystem);
defaultInstanceRenderer.RunSystem = (ecosystem:GameEcosystem) {
    //Changed behaviour?
}

```
### Client Specific
```ts
// UpdateTick function REQUIRED in Source/ClientMain.ts and Source/ServerMain.ts
export function UpdateTickClient(ecosystem:GameEcosystem) {
    //Create new box mesh for babylon (or do any other regular Babylon things that we want with the scene)
    MeshBuilder.createBox("testBox",ecosystem.scene);

    //Run whatever you want on tick here
}

async function OpenServerConnectionAndSendMessage() {
    //Create a new server connection
    new ServerConnection("ws://localhost:8080/ws");
    //Try to connect with this new connection
    try {
        await serverConnection.AttemptToConnect();
    } catch {
        console.error("Could not connect to server");
        return;
    }

    //Send inputs from player to server (if client)
    serverConnection.SendMessageToServer(encode(ThisFrameServerData), MessageToServType.inputs);
}
```


### Server Specific
```ts

export function UpdateTickServer(ecosystem:GameEcosystem) {
    //Very similar to client
    //TODO: To network just mark entity/component to network
}


```