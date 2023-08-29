import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader.js";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { BackgroundCacher } from "./Framework/BackgroundCacher.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";

/** An easy way to load in premade assets from AWS and the GUI editor */
export class AsyncGUIDescription extends BackgroundCacher {
    loadingGUI: AsyncGUILoader = null;
    ourPath: string;
    ourFileIndex: number;

    constructor(path: string, fileIndex = 0) {
        super();
        this.ourPath = path;
        this.ourFileIndex = fileIndex;
    }

    async GetGUICopy(advancedTexture: AdvancedDynamicTexture) {
        if (this.loadingGUI === null) {
            this.loadingGUI = new AsyncGUILoader(this.ourPath, this.ourFileIndex);
        }

        if (this.loadingGUI.AssetFullyLoaded === false) {
            await this.loadingGUI.getWaitForFullyLoadPromise();
        }

        await advancedTexture.parseSerializedObject(JSON.parse(this.loadingGUI.stringData));
    }

    async GetBackgroundCacheTask(): Promise<string> {
        const task = new AsyncGUILoader(this.ourPath, this.ourFileIndex, false);
        await task.PerformBackgroundCache();
        return this.ourPath;
    }
}

class AsyncGUILoader extends AsyncAssetLoader {
    stringData: any;

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.string;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.stringData = cachedResponse;
        return null;
    }
}
