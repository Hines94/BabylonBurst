[< Instanced Mesh System](babylonJsInstancedMesh.md)

# BabylonJs Mesh Performance Investigation

## Investigation into BabylonJs Mesh Performance

A small investigation to find what is the best course of action for upgrading the async mesh system to networked.

### Implementation Ideas

Since the instanced static mesh is extremely strong in multiple instances and fairly equal on single instance multiple meshes it is the clear winner. The system will require some re-writing to enable easy passing from server to client and still enable the client to create client side meshes.

### General

- Thin mesh instances are used for all Static Meshes
- All thin mesh movements are queued false for thinInstanceSetMatrixAt and run at end of frame
- Clones used for all Skeletal Meshes
- Instances get added with a buffer (5/10/30) if more required
- Instances that are no longer in use get hidden instantly (below map)
- Meshes are set as is_visible = false if no instances are visible this frame (makes them free)
- If no description exists for mesh setup then makes new description and adds to fast dictionary

### Server Side Ideas

- “NetworkedMeshInstance” component that stores just mesh and materials
- Optional boolean to load on server side
- Simply change materials etc and set dirty to network changes down to client
- Blank materials in actuality (no mats needed!)

### Client Side Ideas

- “NetworkedMeshInstance” translated into a mesh
- “NetworkedMeshClone” translated into a mesh
- If a networked item is destroyed, the mesh is removed!
- If networked mesh changes then old mesh is removed!

### Culling System

- Uses a hash grid for fast checks
- On camera (or players server?) move, checks if we are through to next grid or same as prior
- New grid items are added and old grid items (on other side) removed

## Performance Observations

In general thin-instance is the winner in most situations. The performance for duplicates with the same materials is superb and the performance for single instances of mesh/material combinations is similar to regular meshes. The main drawback is adding to/deleting these meshes, but with some careful management around hiding and later removing the meshes it should have minimal impact.

## General Observations

- Triangle count seriously impacts performance (far more than other engines like Unity/Unreal)
- Meshes will need to be as small as possible (tri count) to keep performance good, but this is in line with size goals for async mesh loading anyway

### Thin Instances

- Still render multiples off-screen
- Large performance penalty for adding/removing on regular basis (tanks frames to <30 for 1 change per frame)
- Strong performance for large number of single mesh
- Similar performance to with only 1 instance (around 10% less)
- Colour data small(ish) impact

### Instanced Meshes

- Expensive(ish) to create instance but cheap to delete
- Performance in-between regular mesh and instance

### Regular Mesh

- Strongest performance if only 1 per instance
- Performance tails off extremely hard with multiples

### Clones

- Similar to regular mesh in most situations
- Multiples performance gains only marginal

---
