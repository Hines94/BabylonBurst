import { ISoundOptions, Observable, Scene, Sound } from "@babylonjs/core";
import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader.js";
import { GetAsyncSceneIdentifier } from "./Utils/SceneUtils.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";

/** Loads in our audio from Byte Array and gives sound when ready */
class AudioClipLoader extends AsyncAssetLoader {
    options: ISoundOptions = null;

    constructor(path: string, fileName: string, bWaitForLoad: boolean) {
        super(path, fileName, false, false);
        if (bWaitForLoad === false) this.performAsyncLoad();
    }

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.arrayBuffer;
    }
    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        await this.loadInAudio(cachedResponse);
        return null;
    }

    data: ArrayBuffer = null;

    async loadInAudio(arrBuffer: ArrayBuffer) {
        this.data = arrBuffer;
    }
}

function copyBuffer(src: ArrayBuffer) {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

/** An instance of a sound copied from the audiocliploader source */
export class AudioClipInstance {
    loader: AudioClipLoader = null;
    options: ISoundOptions = null;
    audioClip: Sound = null;
    scene: Scene = null;

    onInstanceCreated = new Observable<AudioClipInstance>();

    constructor(loader: AudioClipLoader, scene: Scene, options: ISoundOptions) {
        this.options = options;
        this.loader = loader;
        this.scene = scene;
        this.waitForLoad();
    }

    private async waitForLoad() {
        await this.loader.getWaitForFullyLoadPromise();
        this.audioClip = new Sound("AudioInst", copyBuffer(this.loader.data), this.scene, null, this.options);
        this.onInstanceCreated.notifyObservers(this);
    }

    async awaitLoadedPromise() {
        const loader = this;
        return new Promise((resolve, reject) => {
            if (loader.audioClip !== null) {
                resolve(loader);
            } else {
                loader.onInstanceCreated.add(function () {
                    resolve(loader);
                });
            }
        });
    }
}

export class AsyncAudioClipDefinition {
    awsPath: string = null;
    fileName: string;

    constructor(awsPath: string, fileName: string) {
        this.awsPath = awsPath;
        this.fileName = fileName;
    }
    loader: AudioClipLoader;
    GetSoundInstance(scene: Scene, overwriteOptions: ISoundOptions = null) {
        const id = GetAsyncSceneIdentifier(scene);
        if (this.loader === undefined) {
            this.loader = new AudioClipLoader(this.awsPath, this.fileName, false);
        }

        return new AudioClipInstance(this.loader, scene, overwriteOptions);
    }

    async GetInstanceAndDispose(scene: Scene): Promise<null> {
        const options: ISoundOptions = { autoplay: false };
        const inst = this.GetSoundInstance(scene, options);
        await inst.awaitLoadedPromise();
        inst.audioClip.dispose();
        return null;
    }
}
