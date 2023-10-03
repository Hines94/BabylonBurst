bl_info = {
    # required
    'name': 'BabylonBurstS3Saver',
    'blender': (2, 93, 0),
    'category': 'Object',
    # optional
    'version': (1, 0, 0),
    'author': 'Jack Hines',
    'description': """
    Takes our assets and saves them to S3 in a zip.
    Improves iteration time over manual uploading and zipping.
    Ensure you have AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY variables set in your 
    environment before opening Blender (close and re-open if they change).
    Simply copy this into scripts and run or drop the py file in addons.
    """,
}

import bpy
import tempfile
import zipfile
import os
import subprocess
import sys
 
#Setup so we can install any packages we need!
python_exe = os.path.join(sys.prefix, 'bin', 'python.exe')
target = os.path.join(sys.prefix, 'lib', 'site-packages')
 
subprocess.call([python_exe, '-m', 'ensurepip'])
subprocess.call([python_exe, '-m', 'pip', 'install', '--upgrade', 'pip'])

def InstallPackage(packageName):
    subprocess.call([python_exe, '-m', 'pip', 'install', '--upgrade', packageName, '-t', target])

#Install boto3 to upload easily
try:
    import boto3
except:
    InstallPackage('boto3')
    import boto3

from botocore.exceptions import ClientError

#Get the path to save in our S3 determined by the save name
def GetFilePath():
    path = (bpy.path.basename(bpy.context.blend_data.filepath)).replace('$','/')
    path = path.replace('.blend','')
    path = path.split('~')[0]
    return path

def GetObjectName():
    path = (bpy.path.basename(bpy.context.blend_data.filepath)).replace('$','/')
    path = path.replace('.blend','')
    split_path = path.split('~')
    if len(split_path) > 1:
        return split_path[1]
    else:
        return "BB_ModelUpload"

#Easily create a little popup so we can notify the user
def ShowMessageBox(message = "", title = "Message Box", icon = 'INFO'):
    def draw(self, context):
        self.layout.label(text=message)
    bpy.context.window_manager.popup_menu(draw, title = title, icon = icon)
    
def newMaterial(id):

    mat = bpy.data.materials.get(id)

    if mat is None:
        mat = bpy.data.materials.new(name=id)

    mat.use_nodes = True

    return mat

#Properties that are set by our user
PROPS = [
    ('versioning', bpy.props.EnumProperty(
                    name='Versioning',
                    description='Type of versioning to use',
                    items={
                    ('REPLACE', 'Replace', 'Replace this exact file with this version'),
                    ('REPLACEVERSION', 'Replace Version', 'Replace an exact version (eg version 1)'),
                    ('INCREMENT', 'Increment', 'Maintain the old version and add a new higher version'),
                    ('INCREMENTDELETE', 'Increment And Delete', 'Delete the old version and add a new higher version')
                    },
                    default='REPLACE')),
    ('replaceversion', bpy.props.IntProperty(name='Replace Version Num', default=1)),
    ('includeImages', bpy.props.BoolProperty(name='Include Images', default=False, description='Include Images for our materials? (Only relevant for Static Mesh)')),
    ('awsBucket', bpy.props.StringProperty(name='AWS Bucket', description='Name of the AWS bucket to use', default=''))
]

def GetSizeOfFile(path):
    return  round(os.stat(path).st_size / (1024 * 1024),3)


#Generic method for uploading to S3. Could be for either GLTF or Babylon exporter.
def ZipAndUploadToS3(fileExt, tempDirPath,self, context):  
    with zipfile.ZipFile(tempDirPath +'.zip', 'w', compression=zipfile.ZIP_DEFLATED,compresslevel=9) as zipBlend:
        desiredObjectName = GetObjectName() + fileExt
        zipBlend.write(tempDirPath + fileExt, arcname=desiredObjectName)

    zipMbSize =GetSizeOfFile(tempDirPath + ".zip")
    self.report({'INFO'}, "Saved Zip. File size is: " + str(zipMbSize) + "mb")

        #Last upload to S3
    s3_client = boto3.client('s3',
                                aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
                                aws_secret_access_key= os.environ.get("AWS_SECRET_ACCESS_KEY"))
    #Replace - just an easy upload
    if(context.scene.versioning == 'REPLACE'):
        try:
            objectName = GetFilePath() + ".zip"
            response = s3_client.upload_file(tempDirPath + ".zip", context.scene.awsBucket, objectName)
            ShowMessageBox("Replaced in S3 at location: " + objectName + ". File Size: " + str(zipMbSize) + "mb",
                            "Success!")
        except ClientError as e:
            logging.error(e)

                    
    else: #if (context.scene.versioning == 'REPLACE'):
        self.report({'ERROR'}, "No support yet for this verisoning method!")

#Actual operator for static mesh!
class UploadStaticToS3Operator(bpy.types.Operator):
    bl_idname = 'opr.upload_s3_static_op'
    bl_label = 'Upload static To S3'
    bl_description ="Uploads Static Mesh to S3 with the given params. Note the path is derrived from our filename. (folder$test -> folder/test)"
    
    def execute(self, context):
        #Check if we have any rogue skeletal meshes included
        for obj in bpy.context.selected_objects:
            for modifier in obj.modifiers:
                if modifier.type == "ARMATURE":
                    self.report({'ERROR'}, "Tried to use static mesh uploader for skeletal mesh!")
                    return {'CANCELLED'}

        #Create a temporary dir and work in here
        with tempfile.TemporaryDirectory() as tmpdirname:
            self.report({'INFO'}, "Exporting/Saving In Temp: " + tmpdirname)
            #First save as gltf
            fullPath = tmpdirname + "GLTFObject"
            imageIncludeType = 'NONE'
            if(context.scene.includeImages == True):
                imageIncludeType = 'AUTO'
            bpy.ops.export_scene.gltf(
                    filepath=fullPath,
                    check_existing=False,
                    export_format='GLTF_EMBEDDED',
                    export_image_format=imageIncludeType,
                    export_lights=True,
                    export_materials='EXPORT',
                    export_draco_mesh_compression_enable=True,
                    export_draco_mesh_compression_level=10,
                    use_selection=True,
                    export_apply=True,
                    )
            gltfMbSize =GetSizeOfFile(fullPath + ".gltf")
            self.report({'INFO'}, "Saved GLTF. File size is: " + str(gltfMbSize) + "mb")
            
            #Next zip and perform upload
            ZipAndUploadToS3(".gltf",fullPath,self, context)
                   
        return {'FINISHED'}

#Actual operator for skeletal mesh
class UploadSkeletalToS3Operator(bpy.types.Operator):
    bl_idname = 'opr.upload_s3_skeletal_op'
    bl_label = 'Upload skinned To S3'
    bl_description ="Uploads Skeletal Mesh to S3 with the given params. Note the path is derrived from our filename. (folder$test -> folder/test)"
    
    def execute(self, context):
        #make sure we have at least one skeletal mesh
        found = False
        AAT = bpy.data.actions.get("AAT")
        if AAT == None:
            self.report({'ERROR'}, "No AAT pose. Please make sure we have a neutral T pose named \"AAT\"")
            return {'CANCELLED'}
        for obj in bpy.context.selected_objects:
            if obj.animation_data.action == None or obj.animation_data.action.name != "AAT":
                obj.animation_data.action = AAT
            for modifier in obj.modifiers:
                if modifier.type == "ARMATURE":
                    found = True                  
        if found == False:
            self.report({'ERROR'}, "No skeletal meshes present! Please use static mesh uploader to save size instead!")
            return {'CANCELLED'}
        
        #Remove materials otherwise get textures errors
        for obj in bpy.context.selected_objects:
            objType = getattr(obj, 'type', '')
            if objType != "MESH":
                continue
            for mat in range(0,len(obj.data.materials)):
                exist = obj.data.materials[mat]
                if "DUMMY_" not in exist.name:
                    new = newMaterial("DUMMY_"+exist.name)
                    obj.data.materials[mat] = new
            

        #Create a temporary dir and work in here
        with tempfile.TemporaryDirectory() as tmpdirname:
            self.report({'INFO'}, "Exporting/Saving In Temp: " + tmpdirname)
            #First save as gltf
            fullPath = tmpdirname + "BABYLONOBJECT"

            try:
                bpy.ops.export.bjs(
                        filepath=fullPath + ".babylon",
                        export_selected=True)
            except Exception as e:
                self.report({'ERROR'}, e)
                #self.report({'ERROR'}, "No babylon mesh exporter installed. Please install from https://github.com/BabylonJS/BlenderExporter")
                return {'CANCELLED'}

            babMbSize =GetSizeOfFile(fullPath + ".babylon")
            self.report({'INFO'}, "Saved Babylon File. File size is: " + str(babMbSize) + "mb")
            
            #Next zip and perform upload
            ZipAndUploadToS3(".babylon",fullPath,self, context)
                   
        return {'FINISHED'}
#Visible panel
class ExamplePanel(bpy.types.Panel):
    bl_idname = 'S3_Upload'
    bl_label = 'S3 Uploader'
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "AWSUploader"
    
    def draw(self, context):

        layout = self.layout
        layout.label(text="Path: " + GetFilePath())
        layout.label(text="FileName: " + GetObjectName())
        col = self.layout.column()
        for (prop_name, _) in PROPS:
            row = col.row()
            #Path determined by our filename
            if prop_name == 'path':
                row.enabled = False
            if prop_name == 'replaceversion':
                row = row.row()
                if(context.scene.versioning != "REPLACEVERSION"):
                    continue
            row.prop(context.scene, prop_name)
            
        col.operator('opr.upload_s3_static_op', text='Static Mesh Upload')
        col.operator('opr.upload_s3_skeletal_op', text='Skeletal Mesh Upload')

CLASSES = [
    UploadStaticToS3Operator,
    UploadSkeletalToS3Operator,
    ExamplePanel,
]

def register():
    for (prop_name, prop_value) in PROPS:
        setattr(bpy.types.Scene, prop_name, prop_value)
    
    for klass in CLASSES:
        bpy.utils.register_class(klass)

def unregister():
    for (prop_name, _) in PROPS:
        delattr(bpy.types.Scene, prop_name)

    for klass in CLASSES:
        bpy.utils.unregister_class(klass)


if __name__ == '__main__':
    register()