[< Home](/)

# Assets Overview
Bundling assets together for use is easy in BabylonBurst! The system relies on zipped archives to bundle assets together. We could use seperate assets, but it is slightly more [efficient](https://aws.amazon.com/s3/pricing/) to instead bundle assets together and save GET requests. This is particularly true for items such as prefabs and static models as they are so small that we can easily bundle several together and still have filesizes < 1mb.

Using the combination of zipping and recycle/reuse techniques for models etc the aim is to keep downloads as small as possible. This means we can "stream" games instead of downloading the entire game in one hit!

## Assets Structure
- Zip Archive (eg testfolder/levelBassets.zip)
    - Named items (eg testImage.png)

## Using Assets
- Simply specify the parameters via ECS components or in the client side via the descriptions (AudioDescription etc)
- In editor all items should come with a handy dropdown to select the correct asset (eg just select myZip - myFile - myModel and it should work)
- Assets will be automatically downloaded when required
- TODO: Server will automatically wait for clients to finish downloading prefabs & assets before starting
- For required assets use the TODO: RequireDownload component in level prefab which will also pause level start while clients download the assets

## Automatic Assets
These types of files are automatically detected and given the appropriate type:
- `.png, .jpg` Image
- `.wav` Sound
- `.gltf, .glb, .babylon` Model
- `.Prefab` Prefab
- `.Material` Material Instance
- `.Datasheet` Datasheet

## Steps for Manual Asset Creation
1. Create the assets you want to use
2. If prefab within the .zip then add ~p~ to the name
3. Zip together and upload to S3
4. Done!

## Steps for Automatic Asset Creation
1. Launch the [editor](editor.md) 
2. Drag and drop into the content browser or use the Upload button
3. Drag and drop new/existing asssets into an Archive to bundle
4. Drag and drop into empty content browser space to create a new bundle