[< Home](/)

# Model Pipeline

Since download size is such a priority, some thought must go into how we store and use art assets. Assets should always be created with this purpose in mind, re-using and re-purposing where applicable.

Materials and models should also built with this in mind. Many materials can be re-textured with different albedos etc to add variety without adding extra space.

The <b>Draco Compression</b> method is extremely strong for static meshes so they are FAR smaller than skeletal meshes (10x+)

## Creating Models & Animations

- Create art any way relevant, as long as it can be exported in a `.gltf` format.
- Avoid packaging textures along with the art as these can be packaged separately.
- Package animations along with any models and these should be imported.

## Uploading Models

### Static Mesh

1. **Installation:**
   - Make sure that the “Tools/BlenderMeshAWSUploader.py” addon is installed.
2. **Naming:**
   - Name your asset according to where the upload is to occur to (use `$` to denominate folders - e.g., `characters$test` = `characters/test`).
3. **Method Selection:**
   - Select the method of upload that is required - e.g., replace, increment, etc. Increment will add a version on (e.g., `file_V1`) depending on existing versions.
4. **Upload:**
   - Press the Static Mesh Upload and wait to see the file size.
   - Ensure the file size is as small as possible!

### Skeletal Mesh

1. **Installation:**
   - Ensure the `blender2babylon` plugin is installed: [BlenderExporter](https://github.com/BabylonJS/BlenderExporter)
2. **Usage:**
   - Use the “Skeletal Mesh” option on the addon (same as above).
   - Ensure skeleton and mesh are both selected.
   - Note: Size is much larger than GLTF, but instancing and cloning are a nightmare in GLTF!

### Manual GTLF (Deprecated)

1. **Compression:**
   - Make sure that the gltf uses 10+ cycles of compression.
2. **Texture Upload:**
   - Be careful about uploading textures with the gltf – make sure there is a use for it as we are running on a limited size budget!
3. **File Zipping:**
   - Zip the file into a `.zip`.
4. **Upload:**
   - Upload to the relevant folder on S3.

## Using the Art (Client)

- File is automatically unzipped and loaded with materials setup as per file information
- Specify meshes and materials via a InstancedRender component
- Use a material Instance to specify a specific material to use on the model
   - Alternatively Leave blank to leave the material as what came in the gltf.
   - Number of materials should be same on InstancedRender component