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
