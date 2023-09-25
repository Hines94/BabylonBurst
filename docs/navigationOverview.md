[< Home](/)

# Navigation Overview
Navigation is built into the engine with the inclusion of Recast & Detour from vcpkg. It is easily setup and used, and the system is designed to provide multiple specifications.

TODO: Provide different options for surface types and build types

## Building a Navmesh
- Add a NavmeshBuildSetup component to specify a desired navigation build
- Add NavigatableEntitySurface components to any surface that we want built into the navigation
- Navigations will be built and stored automatically with Prefabs - eg creating a map prefab will store the Nav data with that map
- Any deviance from the current built surface will trigger a rebuild

## Inspecting a Navmesh
- Open the [editor](editor.md) and open your desired Prefab
- If already cached then you will **NOT** see any visual options under View->Navigation
    - In this case use Build->RebuildNav
- Use the checklist items under View->Navigation
    - Show Nav Geom In - shows the geometry passed into the building phase (i.e surface meshes)
    - Show Nav Heightfield - shows the generated heightfield before compression (will give an idea of voxelistaion)
    - Show Nav Regions - shows the seperate generated regions for the navmesh 
    - Show Contours - contours that break up regions
    - Show Low Poly Navmesh - shows the LP navmesh that is used to perform final navigation
    - Show Navmesh - shows the high poly navmesh that is used to perform final navigation

## TODO: Using nav agents
