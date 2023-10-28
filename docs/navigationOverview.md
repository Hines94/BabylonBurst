[< Home](/)

# Navigation Overview
Navigation is built into the engine with the inclusion of Recast & Detour from vcpkg. It is easily setup and used, and the system is designed to provide multiple specifications.

TODO: Provide different options for surface types and build types

## Building a Navmesh
- Add a NavigationLayer component to specify a desired navigation build
- Add NavigatableEntitySurface components to any surface that we want built into the navigation
- Navigations will be built and stored automatically with Prefabs - eg creating a map prefab will store the Nav data with that map
- Any deviance from the current built surface will trigger a rebuild if NavigationLayer is set to automatic (toggle)

> WARNING: If not automatic set true in layer then Build->RebuildNav will be required

## Inspecting a Navmesh
- Open the [editor](editor.md) and open your desired Prefab
- Use the View -> ShowNavmesh toggle
- To build use Build->RebuildNav

## Using nav agents
- Ensure there is a valid navmesh (can check for NavigationLayer.GetNavigationLayer())
- Create a NavAgent component type and add to an Entity
- Change the TargetLocation for automatic movement
- Use TeleportToLocation for instant teleport
- Inspect the next path directon for an agent using view->Show NavAgent Paths

## Extending nav agents
TODO: Allow extension with regards to request movement and rotation (eg look at direction before/whilst moving etc)
