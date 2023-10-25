[< Home](/)

# Prefab Instancing

The ability to add prefabrications to a game scene is crucial. In the early days of Space Fleets, attempts were made to use Blender with name conventions, etc., to set up objects in a Babylonjs scene. However, it quickly became evident that this approach was neither sustainable nor scalable. As such, a new system was deemed necessary.

## Basic Prefab Info/Setup

A prefab can be created from the editor. This process involves right-clicking any folder and using the `newPrefab` option. This action will yield a blank prefab assigned a UUIDV4, which can be opened in a new window and utilized elsewhere.

### Key Information:
- Each prefab has a UUIDV4 to easily identify it, separate from the prefab name.
- Each entity on the prefab has a “Prefab” component, with the UUID prefilled and the relative ID (entityID) of this entity (e.g., 1, 2, 3, etc.)

### Data Storage:
Prefab data is stored as a JSON comprising:
- `prefabID`: UUIDV4 of prefab
- `prefabData`: Entity data in Msgpack format

## Prefab Instances

Instances can be integrated into other prefabs or maps/scenes. All default set values on the instance will be loaded.

### Conventional Loading:
1. Add a PrefabInstance component
2. Use the dropdown to select the prefab that you want to load
3. The default data for that prefab will then be loaded and referenced back to the instance that has been added
4. On removal of the component the prefab entities will also be removed

### Changing Data from Default:
- Data can be easily altered
- Any deviations from the prefab default will be retained
- Additional entities & components, not part of a the prefab type if it changes, will be eradicated upon re-load
