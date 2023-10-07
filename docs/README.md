# Babylon Burst

> A high performance ECS based system for easily making multiplayer BabylonJs games.

## Essentials
- [Install Quickstart](installQuickstart.md) - How to setup and run BabylonBurst for the first time
- [Editor Quickstart](editor.md) - How to setup, launch and use the Editor
- [Coding Quickstart](codeQuickstart.md) - How to setup and start modifying in the Source directory
- [Game Ecosystem](ecosystemOverview.md) - The glue that ties BabylonJs scenes and our ECS infrastructure
- [Engine Upgrade](engineUpgrade.md) - How to upgrade to the latest engine version

## Launching In Dev Mode
> **./bbStartDev.sh** to launch. 

This will start the linux backend server + start the frontend on localhost.5173
> **./bbStartDev.sh -edit** to launch with additional editor functionality. 

## Details
Detailed explanations of how the underlying systems work in BabylonBoost. Includes further details and more technical segments to help provide context on technical decisions and how to use all engine features.
### Assets
- [Assets Overview](assetsOverview.md) - Outline of how to bundle and access assets from s3

### ECS
- [ECS Overview](ecsOverview.md) - Outline of how the high performance ECS system works

### Networking
- [Networking Overview](networkingOverview.md) - Outline of how the networking system works and how to use it

### Navigation
- [Navigation Overview](navigationOverview.md) - Outline of how to use Recast & Detour with the ECS system

### Physics
- [Physics Overview](physicsOverview.md) - Outline of how to use the inbuilt Bullet Physics system

### Prefabs
- [Prefab Instancing](prefabInstancing.md) - How to create and use Prefabs

### Rendering
- [Instanced Mesh System](babylonJsInstancedMesh.md) - A high performance and automatic system based on the InstancedRender component.

### Tools
- [Models Pipeline](modelsPipeline.md) - How to upload and use models in BabylonBurst