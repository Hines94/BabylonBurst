bl_info = {
    # required
    'name': 'BabylonBurstS3Saver',
    'blender': (2, 93, 0),
    'category': 'Object',
    # optional
    'version': (1, 1, 0),
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

# ------------ EXPORT ONLY SELECT ANIMS -------------------

def filter_animations_by_prefix(context):
    prefix = context.scene.animationPrefix  
    objects_to_restore = {}
    
    for obj in bpy.context.scene.objects:
        if obj.animation_data and obj.animation_data.action:
            action = obj.animation_data.action
            if not action.name.startswith(prefix):
                # Store FCurve data before removal for each object
                fcurve_data = []
                for fcurve in action.fcurves:
                    data_path = fcurve.data_path
                    array_index = fcurve.array_index
                    keyframe_points = [(key.co[0], key.co[1]) for key in fcurve.keyframe_points]
                    fcurve_data.append({'data_path': data_path, 'array_index': array_index, 'keyframe_points': keyframe_points})

                # Remove FCurves
                fcurves_to_remove = [fcurve for fcurve in action.fcurves]
                for fcurve in fcurves_to_remove:
                    action.fcurves.remove(fcurve)

                # Store object and its FCurve data for restoration
                objects_to_restore[obj.name] = {'action': action, 'fcurve_data': fcurve_data}
    
    return objects_to_restore

# Function to restore FCurves to the original action
def restore_removed_animations(objects_to_restore):
    restored_objects = []

    for obj_name, restore_data in objects_to_restore.items():
        obj = bpy.data.objects.get(obj_name)
        if obj:
            original_action = restore_data['action']
            fcurve_data = restore_data['fcurve_data']

            # Clear existing FCurves from the original action
            original_action.fcurves.clear()

            # Restore FCurves to the original action
            for fcurve_info in fcurve_data:
                data_path = fcurve_info['data_path']
                array_index = fcurve_info['array_index']
                keyframe_points = fcurve_info['keyframe_points']

                fcurve = original_action.fcurves.new(data_path, index=array_index)

                # Add keyframes to the restored FCurve
                for frame, value in keyframe_points:
                    fcurve.keyframe_points.insert(frame, value)

            # Assign the restored action back to the object
            obj.animation_data.action = original_action
            restored_objects.append(obj)
    
    return restored_objects

# ------------ EXPORT ONLY SELECT ANIMS -------------------

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
    ('includeImages', bpy.props.BoolProperty(name='Include Images', default=False, description='Include Images for our materials?')),
    ('selectedonly', bpy.props.BoolProperty(name='Selected Only', default=False, description='Upload selected items only?')),
    ('awsBucket', bpy.props.StringProperty(name='AWS Bucket', description='Name of the AWS bucket to use', default='')),
    ('animationPrefix', bpy.props.StringProperty(name='Animation Prefix', description='Prefix of the animations to export', default=''))
]

def GetSizeOfFile(path):
    return  round(os.stat(path).st_size / (1024 * 1024),3)


#Generic method for uploading to S3. Could be for either glb or Babylon exporter.
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
    bl_description ="Uploads Mesh to S3 with the given params. Note the path is derrived from our filename. (folder$test -> folder/test)"
    
    def execute(self, context):
        # Filter animations by prefix
        removed_animations = filter_animations_by_prefix(context)

        #Create a temporary dir and work in here
        with tempfile.TemporaryDirectory() as tmpdirname:
            self.report({'INFO'}, "Exporting/Saving In Temp: " + tmpdirname)
            #First save as glb
            fullPath = tmpdirname + "glbObject"
            imageIncludeType = 'NONE'
            if(context.scene.includeImages == True):
                imageIncludeType = 'AUTO'
            bpy.ops.export_scene.gltf(
                    filepath=fullPath,
                    check_existing=False,
                    export_format='GLB',
                    export_image_format=imageIncludeType,
                    export_lights=True,
                    export_materials='EXPORT',
                    export_draco_mesh_compression_enable=True,
                    export_draco_mesh_compression_level=7,
                    use_selection=context.scene.selectedonly,
                    export_apply=True,
                    export_animations=True,
                    export_optimize_animation_size=True,
                    export_nla_strips =False,
                    export_animation_mode='ACTIONS'
                    )
            glbMbSize =GetSizeOfFile(fullPath + ".glb")
            self.report({'INFO'}, "Saved glb. File size is: " + str(glbMbSize) + "mb")
            
            #Next zip and perform upload
            ZipAndUploadToS3(".glb",fullPath,self, context)

        # Restore the removed animations
        restore_removed_animations(removed_animations)
                   
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
            
        col.operator('opr.upload_s3_static_op', text='Mesh Upload')

CLASSES = [
    UploadStaticToS3Operator,
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