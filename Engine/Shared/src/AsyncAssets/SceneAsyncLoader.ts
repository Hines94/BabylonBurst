import { ISceneLoaderAsyncResult, Observable, SceneLoader, DracoCompression, Mesh, Scene, AssetContainer, InstantiatedEntries, Skeleton, AnimationGroup, AbstractMesh, Vector3 } from "@babylonjs/core";
import { AsyncAssetLoader, GetPreviouslyLoadedAWSAssetCustomPath } from "./Framework/AsyncAssetLoader.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";
import { AsyncDataType, GetAssetFullPath } from "./Utils/ZipUtils.js";

function matchesMeshPattern(baseString: string, str: string) {
    const pattern = new RegExp("^" + baseString + "(_primitive\\d+)?$");
    return pattern.test(str);
}

interface MeshCount {
    [key: string]: number;
}

var asyncSceneLoaders: {
    [sceneid: string]: { [loaderID: string]: SceneAsyncLoader };
} = {};

/**
 * The acual "loader" for a GLB scene. Will load from AWS and hide the loaded meshes via isVisible.
 */
export class SceneAsyncLoader extends AsyncAssetLoader {
    onMeshLoaded = new Observable<SceneAsyncLoader>();
    extensionType: string;
    desiredScene: Scene = null;
    container:AssetContainer;

    constructor(assetPath: string, fileName: string, scene: Scene, extensionType: string) {
        super(assetPath, fileName, false);
        this.desiredScene = scene;
        this.extensionType = extensionType;

        //To avoid repeatedly getting same
        const sceneId = GetAsyncSceneIdentifier(scene);
        if (asyncSceneLoaders[sceneId] === undefined) {
            asyncSceneLoaders[sceneId] = {};
        }
        asyncSceneLoaders[sceneId][GetAssetFullPath(assetPath, fileName)] = this;

        //Start loading in models
        if (scene !== undefined) {
            this.performAsyncLoad();
        }
    }

    /** Get an existing one if possible */
    static GetAsyncSceneLoader(scene: Scene, desiredPath: string, fileName: string, extensionPath:string, bAutoCreate = true): SceneAsyncLoader {
        if (asyncSceneLoaders[GetAsyncSceneIdentifier(scene)] === undefined) {
            if(bAutoCreate) asyncSceneLoaders[GetAsyncSceneIdentifier(scene)] = {};
            else return undefined;
        }
        if(bAutoCreate) asyncSceneLoaders[GetAsyncSceneIdentifier(scene)][GetAssetFullPath(desiredPath, fileName)] = new SceneAsyncLoader(desiredPath,fileName,scene,extensionPath);
        return asyncSceneLoaders[GetAsyncSceneIdentifier(scene)][GetAssetFullPath(desiredPath, fileName)];
    }

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.arrayBuffer;
    }

    override async onAsyncDataLoaded(dataFromZip: any): Promise<null> {
        const blob = new Blob([dataFromZip], { type: 'model/GLB-binary' });
        const url = URL.createObjectURL(blob);

        try{
            var result = await SceneLoader.ImportMeshAsync(
                "",
                "",
                url,
                this.desiredScene,
                null,
                this.extensionType
            );
            this.container = new AssetContainer(this.desiredScene);
            this.container.animationGroups = result.animationGroups;
            this.container.meshes = result.meshes;
            // Remove useless root
            this.container.meshes.forEach(m=>{if(m.name.includes('__root__')) {
                m.rotation = new Vector3();
                m.dispose(true)
            }});
            this.container.skeletons = result.skeletons;
            this.container.transformNodes = result.transformNodes;
            this.container.geometries = result.geometries;
            this.container.lights = result.lights;
            this.container.removeAllFromScene();
        } catch {
            console.error(`Failed to load scene ${this.requestedAssetPath} - ${this.desiredFileName}`)
        }

        this.onMeshLoaded.notifyObservers(this);

        return null;
    }

    extractMeshElements(meshName: string): Mesh[] {
        var foundMeshElements: Mesh[] = [];
        if(!this.container || !this.container.meshes) return foundMeshElements;
        const LoadedMeshes = this.container.meshes;
        for (var i = 0; i < LoadedMeshes.length; i++) {
            if (matchesMeshPattern(meshName, LoadedMeshes[i].id)) {
                const asMesh = LoadedMeshes[i] as Mesh;
                if (asMesh === null || asMesh === undefined) {
                    console.error("Mesh " + LoadedMeshes[i].name + " is not a mesh! Its abstract something...");
                } else {
                    foundMeshElements.push(LoadedMeshes[i] as Mesh);
                }
            }
        }
        return foundMeshElements;
    }

    /** Import meshes as clones from the container we have */
    importMeshesToScene(meshName:string) : {meshes:AbstractMesh[],skels:Skeleton[],anims:AnimationGroup[]} {
        if(!this.container || !this.container.meshes) return undefined;
        const desiredMeshes = this.container.meshes.filter(m=>{
            return matchesMeshPattern(meshName,m.name)
        });
        const desiredSkels = this.container.skeletons.filter(s=>{
            for(var m = 0; m < desiredMeshes.length;m++) {
                if(desiredMeshes[m].skeleton === s) return true;
            }
            return false;
        })
        const desiredAnims = this.container.animationGroups.filter(a=>{
            if(!a.targetedAnimations || a.targetedAnimations.length === 0) return false;
            for(var s = 0; s < desiredSkels.length;s++) {
                const skel = desiredSkels[s];
                if(skel.bones && skel.bones.length > 0 && skel.bones[0].getTransformNode() === a.targetedAnimations[0].target) {
                    return true;
                }
            }
            return false;
        })

        const s = this.container.instantiateModelsToScene(undefined,undefined,{predicate:(e)=>{
            if(e instanceof Mesh) {
                return desiredMeshes.includes(e);

            } else if(e instanceof Skeleton) {
                return desiredSkels.includes(e);

            } else if(e instanceof AnimationGroup) {
                return desiredAnims.includes(e);
            }
            return true;
        }});
        const meshes:Mesh[] = [];
        s.rootNodes.forEach(m=>{
            m.getChildMeshes().forEach(fm=>meshes.push(fm as Mesh));
        })
        return {meshes:meshes,skels:s.skeletons,anims:s.animationGroups}
    }

    extractUniqueMeshes(): MeshCount {
        let meshCount: MeshCount = {};
        if (!this.container) {
            return meshCount;
        }

        // RegExp to identify base mesh name and ignore _primitiveX
        const pattern = /^(.*?)(_primitive(\d+))?$/;

        this.container.meshes.forEach(mesh => {
            const meshName = mesh.name;
            if (meshName === "__root__") {
                return;
            }

            const match = meshName.match(pattern);

            if (match) {
                const baseMesh = match[1]; // just the base name, ignoring primitive suffix

                if (!meshCount[baseMesh]) {
                    meshCount[baseMesh] = 0;
                }

                meshCount[baseMesh]++;
            }
        });

        return meshCount;
    }

    override GetAssetFullPath(): string {
        const fullPath = GetAsyncSceneIdentifier(this.desiredScene) + super.GetAssetFullPath();
        return fullPath;
    }
    //TODO validate all meshes have definitions created!
}
