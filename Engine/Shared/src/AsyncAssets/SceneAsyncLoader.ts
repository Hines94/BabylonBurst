import { ISceneLoaderAsyncResult, Observable, SceneLoader, DracoCompression, Mesh, Scene } from "@babylonjs/core";
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
    loadedGLB: ISceneLoaderAsyncResult;
    onMeshLoaded = new Observable<SceneAsyncLoader>();
    extensionType: string;
    desiredScene: Scene = null;

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
    static GetAsyncSceneLoader(scene: Scene, desiredPath: string, fileName: string): SceneAsyncLoader {
        if (asyncSceneLoaders[GetAsyncSceneIdentifier(scene)] === undefined) {
            return undefined;
        }
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
            this.loadedGLB = result;
        } catch {
            console.error(`Failed to load scene ${this.requestedAssetPath} - ${this.desiredFileName}`)
        }
        //Hide all of our meshes until we are ready to use them!
        this.SetMeshesHidden(false);

        this.onMeshLoaded.notifyObservers(this);

        return null;
    }

    SetMeshesHidden(bVisible: boolean) {
        if(!this.loadedGLB || !this.loadedGLB.meshes) return;
        for (var i = 0; i < this.loadedGLB.meshes.length; i++) {
            this.loadedGLB.meshes[i].isVisible = bVisible;
        }
    }

    extractMeshElements(meshName: string): Mesh[] {
        var foundMeshElements: Mesh[] = [];
        if(!this.loadedGLB || !this.loadedGLB.meshes) return foundMeshElements;
        const LoadedMeshes = this.loadedGLB.meshes;
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

    extractUniqueMeshes(): MeshCount {
        let meshCount: MeshCount = {};
        if (!this.loadedGLB) {
            return meshCount;
        }

        // RegExp to identify base mesh name and ignore _primitiveX
        const pattern = /^(.*?)(_primitive(\d+))?$/;

        this.loadedGLB.meshes.forEach(mesh => {
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
