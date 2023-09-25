[< Home](/)

# Game Ecosystem Overview
The ecosystem is at the heart of all things client side. It enables hooks into our WASM container, and allows us to directly influence the BabylonJs scene. It is how all of the built in engine systems (InstancedRender etc) will process data from ECS -> BabylonJs scene and is extrtemely important for expanding on base Editor functionality.

Ecosystems are self contained bubbles of functionality. They contain information on inputs, ECS, Babylon scenes and more. Each new window opened (in the case of popout windows) contains its own ecosystem. This allows us to do powerful things like provide popout renderers for displaying skins or character equipment etc and take advantage of multiple monitors.

On tick the ecocystem will be passed in to our Source main.ts tick and this is what allows us to implement custom client side BabylonJs logic.

Examples of how to use can be found [here](codeQuickstart.md?id=typescript-coding)