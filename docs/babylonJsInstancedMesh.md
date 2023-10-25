[< Home](/)

# Instanced Mesh Render System

We use a instanced mesh rendering system to improve performance for rendering in BabylonJs. Testing [here](babylonJsMeshInvestig.md) has shown that the fastest approach is to generate instances and keep them hidden if not required. 

The system will do the following:
- Asynchronously download models and combine them together with appropriate materials
- Incrementally incerease model number in preset jumps to avoid changing instance number every increase/decrease
- Set any meshes with no visible instances as is_visible = false