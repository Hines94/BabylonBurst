import { decode } from "@msgpack/msgpack";
import { AsyncAssetLoader, AsyncDataType } from "../AsyncAssets";



export class AsyncJSONLoader extends AsyncAssetLoader {
    //TODO: better caching tactics for JSON?
    ignoreCache = true;
    data: any;
    rawData: string;
    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.string;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.rawData = cachedResponse;
        this.data = JSON.parse(cachedResponse);
        return null;
    }
}

export class AsyncStringLoader extends AsyncAssetLoader {
    //TODO: better caching tactics for JSON?
    ignoreCache = true;
    rawData: string;
    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.string;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.rawData = cachedResponse;
        return null;
    }
}

export class AsyncArrayBufferLoader extends AsyncAssetLoader {
    //TODO: better caching tactics for JSON?
    ignoreCache = true;
    rawData: ArrayBuffer;
    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.arrayBuffer;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.rawData = cachedResponse;
        return null;
    }
}

export class AsyncMsgpackLoader extends AsyncAssetLoader {
    msgpackData:any;

    static GetMsgpackLoader(awsPath:string,filename:string) : AsyncMsgpackLoader{
        const exist = AsyncAssetLoader.GetPreviouslyLoadedAsset(awsPath,filename);
        if(exist) {
            return exist as AsyncMsgpackLoader;
        }
        return new AsyncMsgpackLoader(awsPath,filename);
    }

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.arrayBuffer;
    }
    onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        this.msgpackData = decode(cachedResponse);
        return null;
    }

}