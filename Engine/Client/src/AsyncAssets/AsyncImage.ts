import { Texture } from "@babylonjs/core";
import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader.js";
import { BackgroundCacher } from "./Framework/BackgroundCacher.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";

/** An easy way to load in premade assets from AWS into a easy to use Image */
export class AsyncImageDescription extends BackgroundCacher {
    loadingImage: AsyncImageLoader = null;
    ourPath: string;
    ourFileIndex: number;
    hasAlpha = true;

    constructor(path: string, fileIndex = 0, hasAlpha = true) {
        super();
        this.hasAlpha = hasAlpha;
        this.ourPath = path;
        this.ourFileIndex = fileIndex;
    }

    async WaitForImageToLoad() {
        if (this.loadingImage === null) {
            this.loadingImage = new AsyncImageLoader(this.ourPath, this.ourFileIndex);
        }

        if (this.loadingImage.AssetFullyLoaded === false) {
            await this.loadingImage.getWaitForFullyLoadPromise();
        }
    }

    async GetImageAsBase64(): Promise<string> {
        await this.WaitForImageToLoad();
        return this.loadingImage.stringDataBase64;
    }

    async GetImageAsTexture(): Promise<Texture> {
        await this.WaitForImageToLoad();
        const ret = this.loadingImage.GetTextureData();
        ret.hasAlpha = this.hasAlpha;
        return ret;
    }

    async GetBackgroundCacheTask(): Promise<string> {
        const task = new AsyncImageLoader(this.ourPath, this.ourFileIndex, false);
        await task.PerformBackgroundCache();
        return this.ourPath;
    }
}

class AsyncImageLoader extends AsyncAssetLoader {
    stringDataBase64: string = null;
    private textureData: Texture = null;

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.blob;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        //@ts-ignore - TODO: This will not work in node!
        var reader = new FileReader();
        reader.readAsDataURL(cachedResponse);
        this.stringDataBase64 = await this.getBlobLoadedPromise(reader);
        return null;
    }

    GetTextureData() {
        if (this.textureData === null) {
            this.textureData = new Texture(this.stringDataBase64);
        }
        return this.textureData;
    }

    getBlobLoadedPromise(reader: any): Promise<string> {
        return new Promise((resolve, reject) => {
            reader.onload = function () {
                resolve(reader.result.toString());
            };
            reader.onerror = function () {
                console.error("ERROR LOADING IMAGE");
                reject(null);
            };
        });
    }
}
