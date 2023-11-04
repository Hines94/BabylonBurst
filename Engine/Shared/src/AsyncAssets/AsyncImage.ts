import { Texture } from "@babylonjs/core";
import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader.js";
import { BackgroundCacher } from "./Framework/BackgroundCacher.js";
import { AsyncDataType } from "./Utils/ZipUtils.js";
import { CreateBlobInNewWindow } from "../Utils/HTMLUtils.js";

/** An easy way to load in premade assets from AWS into a easy to use Image */
export class AsyncImageDescription extends BackgroundCacher {
    loadingImage: AsyncImageLoader;
    ourPath: string;
    ourFileName: string;
    hasAlpha = true;

    constructor(path: string, fileName: string, hasAlpha = true) {
        super();
        this.hasAlpha = hasAlpha;
        this.ourPath = path;
        this.ourFileName = fileName;
    }

    async WaitForImageToLoad() {
        if (this.loadingImage === undefined) {
            const previous = AsyncAssetLoader.GetPreviouslyLoadedAsset(this.ourPath,this.ourFileName);
            if(previous && previous instanceof AsyncImageLoader) {
                this.loadingImage = previous;
            } else {
                this.loadingImage = new AsyncImageLoader(this.ourPath, this.ourFileName);
            }
        }

        if (this.loadingImage.AssetFullyLoaded === false) {
            await this.loadingImage.getWaitForFullyLoadPromise();
        }
    }

    async GetImageAsBase64(): Promise<string> {
        await this.WaitForImageToLoad();
        return await this.loadingImage.GetStringData();
    }

    async GetImageAsTexture(): Promise<Texture> {
        await this.WaitForImageToLoad();
        const ret = await this.loadingImage.GetTextureData();
        ret.hasAlpha = this.hasAlpha;
        return ret;
    }

    /** Given a Div element - setup the background image with this */
    async SetupDivAsImage(element:HTMLDivElement) {
        await this.WaitForImageToLoad();
        element.style.backgroundImage = `url("${this.loadingImage.blobURL}")`;
    }

    async GetBackgroundCacheTask(): Promise<string> {
        const task = new AsyncImageLoader(this.ourPath, this.ourFileName, false);
        await task.PerformBackgroundCache();
        return this.ourPath;
    }
}

class AsyncImageLoader extends AsyncAssetLoader {
    private stringDataBase64: string;
    private textureData: Texture;
    blobResponse:Blob;
    blobURL:string;

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.blob;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.blobResponse = cachedResponse;
        this.blobURL = URL.createObjectURL(this.blobResponse);
        return null;
    }

    async GetStringData() {
        if(this.blobResponse === undefined) {
            await this.getWaitForFullyLoadPromise();
        }

        if(this.stringDataBase64 === undefined){
            var reader = new FileReader();
            reader.readAsDataURL(this.blobResponse);
            this.stringDataBase64 = await this.getBlobLoadedPromise(reader);
        }

        return this.stringDataBase64; 
    }

    async GetTextureData() {
        await this.GetStringData();
        if (this.textureData === undefined) {
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
