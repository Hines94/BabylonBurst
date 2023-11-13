import { Texture } from "@babylonjs/core";
import { AsyncAssetLoader } from "./Framework/AsyncAssetLoader";
import { AsyncDataType } from "./Utils/ZipUtils";
import { resizeImageBlob } from "./Utils/BlobUtils";


/** An easy way to load in premade assets from AWS into a easy to use Image */
export class AsyncImageDescription {
    loadingImage: AsyncImageLoader;
    ourPath: string;
    ourFileName: string;
    hasAlpha = true;

    constructor(path: string, fileName: string, hasAlpha = true) {
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

    async SetupAsCursor(doc:Document, size = 64, relOffset = {x:0.5,y:0.5}) {
        const data = await this.loadingImage.getCursorData(size);
        const res = `url("${data}")`;
        const offsetx = relOffset.x * size;
        const offsety = relOffset.y * size;
        doc.body.style.cursor= `${res} ${offsetx} ${offsety}, pointer`;
    }

}

class AsyncImageLoader extends AsyncAssetLoader {
    private stringDataBase64: string;
    private textureData: Texture;
    blobResponse:Blob;
    blobURL:string;

    resizedCursorDatas:{[size:number]:string} = {};

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

    async getCursorData(size:number = 64) {
        if (this.resizedCursorDatas[size] !== undefined) {
            return this.resizedCursorDatas[size];
        }
        await this.getWaitForFullyLoadPromise();
        
        const image = this;
        const resizedBlob = await resizeImageBlob(this.blobResponse, 64, 64);
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = () => {
                image.resizedCursorDatas[size] = reader.result.toString();
                resolve(image.resizedCursorDatas[size]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(resizedBlob);
        });
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
