import { Observable, Observer } from "@babylonjs/core";
import { AsyncDataType, GetZippedFile } from "../Utils/ZipUtils.js";
import { CacheWorkerDirective, CacheWorkerResult } from "./CacheWorkerTypes.js";
import { AsyncAssetManager } from "../index.js";

/** This will pull down a zip file in full if we don't have it
 *  and save the contents to our frontend storage */
var existingZipPullers: { [id: string]: AsyncZipPuller } = {};

export class AsyncZipPuller {
    //TODO: If versioning then remove old versions from response cache?
    filePath: string;
    startLoadTime = performance.now();
    onAssetLoad = new Observable();
    completed = false;
    success = true;

    webWorkerObserve: Observer<CacheWorkerResult>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.PerformLoadProcess();
    }

    private async PerformLoadProcess() {
        if (!this.filePath || this.filePath.replace(".zip", "") === "") {
            this.completed = true;
            this.onAssetLoad.notifyObservers(null);
            return;
        }

        var manager = AsyncAssetManager.GetAssetManager();
        const webWorker = await manager.GetWebWorker();
        if (webWorker !== undefined) {
            if (manager.printDebugStatements) {
                console.log("USING WEB WORKER FOR ASYNC ZIP PULLER: " + this.filePath);
            }
            const directive: CacheWorkerDirective = {
                path: this.filePath,
            };
            webWorker.postMessage(directive);
            this.webWorkerObserve = manager.onWebWorkerCompleteCaching.add(this.WebWorkerComplete.bind(this));
        } else {
            this.processBackendResponse(await manager.backendStorage.GetItemAtLocation(this.filePath));
        }
    }

    static RemoveCacheAtLocation(location: string) {
        //Remove zip puller caching for all items within this Zip
        delete existingZipPullers[location];
    }

    static GetOrFindAsyncPuller(location: string) {
        if (existingZipPullers[location]) {
            return existingZipPullers[location];
        }
        return new AsyncZipPuller(location);
    }

    //For online - process our AWS response and check for any cached so we don't need to re-download
    private async processBackendResponse(zipBytes: Uint8Array) {
        var manager = AsyncAssetManager.GetAssetManager();
        await manager.frontendCache.Put(zipBytes, this.filePath);

        const loadTime = (performance.now() - this.startLoadTime) / 1000;
        if (manager.printDebugStatements) {
            console.log("Time to load asset from Backend: " + this.filePath + " " + loadTime + "s");
        }

        this.completed = true;
        this.onAssetLoad.notifyObservers(null);
    }

    GetFinishedPromise(): Promise<boolean> {
        const puller = this;
        return new Promise((resolve, reject) => {
            if (puller.completed === true) {
                resolve(true);
            }
            puller.onAssetLoad.add(() => {
                resolve(true);
            });
        });
    }

    async WebWorkerComplete(data: CacheWorkerResult) {
        if (data.path !== this.filePath) {
            return;
        }
        this.completed = true;
        this.success = data.success;
        this.onAssetLoad.notifyObservers(null);
        const manager = AsyncAssetManager.GetAssetManager();
        manager.onWebWorkerCompleteCaching.remove(this.webWorkerObserve);
    }

    static async LoadFileData(
        assetPath: string,
        fileName: string,
        dataType: AsyncDataType,
        bIgnoreCache: boolean
    ): Promise<any> {
        //Already cached from Frontend?
        if (!bIgnoreCache) {
            const preloadedData = await AsyncZipPuller.GetCachedFile(assetPath);
            if (preloadedData !== null) {
                return await GetZippedFile(preloadedData, dataType, fileName);
            }
        }

        //Get general payload from Backend (covers all items in zip)
        var existingPuller = existingZipPullers[assetPath];
        if (existingPuller === null || existingPuller === undefined) {
            existingPuller = new AsyncZipPuller(assetPath);
        }
        await existingPuller.GetFinishedPromise();

        //Return specific item requested (eg file 0)
        return await GetZippedFile(await AsyncZipPuller.GetCachedFile(assetPath), dataType, fileName);
    }

    static async GetCachedFile(assetFullPath: string) {
        var manager = AsyncAssetManager.GetAssetManager();
        var cachedResult = await manager.frontendCache.Get(assetFullPath);
        if (cachedResult !== undefined && cachedResult !== null) {
            return cachedResult;
        }
        return null;
    }
}
