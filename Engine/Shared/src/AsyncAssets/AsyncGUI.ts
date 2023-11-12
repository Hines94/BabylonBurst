import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader.js";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { AsyncDataType } from "./Utils/ZipUtils.js";

/** An easy way to load in premade assets from AWS and the GUI editor */
export class AsyncGUIDescription {
    loadingGUI: AsyncGUILoader = null;
    ourPath: string;
    ourFileName: string;

    constructor(path: string, fileName: string) {
        this.ourPath = path;
        this.ourFileName = fileName;
    }

    async GetGUICopy(advancedTexture: AdvancedDynamicTexture) {
        if (this.loadingGUI === null) {
            this.loadingGUI = new AsyncGUILoader(this.ourPath, this.ourFileName);
        }

        if (this.loadingGUI.AssetFullyLoaded === false) {
            await this.loadingGUI.getWaitForFullyLoadPromise();
        }

        await advancedTexture.parseSerializedObject(JSON.parse(this.loadingGUI.stringData));
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
