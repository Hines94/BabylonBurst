import { Observable, Observer } from "@babylonjs/core";
import { AsyncDataType, GetZippedFile } from "../Utils/ZipUtils.js";
import { CacheWorkerDirective, CacheWorkerResult, ZipWorkerDirective } from "./CacheWorkerTypes.js";
import { AsyncAssetManager } from "../index.js";
import { WaitForTime } from "../../../../Client/src/Utils/SceneUtils.js";
import { asyncAssetLogIdentifier } from "./AsyncAssetManager.js";
import { WaitForObservable } from "../Utils/BabylonUtils.js";

/** This will pull down a zip file in full if we don't have it
 *  and save the contents to our frontend storage */
var inFlightPullers: { [id: string]: AsyncZipPuller } = {};

export class AsyncZipPuller {
    //TODO: If versioning then remove old versions from response cache?
    filePath: string;
    startLoadTime = performance.now();
    onAssetLoad = new Observable();
    completed = false;
    success = true;
    bIgnoreCache =false;

    webWorkerObserve: Observer<CacheWorkerResult>;

    constructor(filePath: string,bIgnoreCache =false) {
        this.filePath = filePath;
        this.bIgnoreCache = bIgnoreCache;
        this.PerformLoadProcess();
    }

    private async PerformLoadProcess() {
        inFlightPullers[this.filePath] = this;
        if (!this.filePath || this.filePath.replace(".zip", "") === "") {
            this.completed = true;
            this.onAssetLoad.notifyObservers(null);
            return;
        }

        //Manager will load and put into cache for us
        await AsyncAssetManager.GetAssetManager().GetItemAtLocation(this.filePath,this.bIgnoreCache);

        inFlightPullers[this.filePath] = undefined;
        this.completed = true;
        this.onAssetLoad.notifyObservers(null);
        
    }

    static RemoveCacheAtLocation(location: string) {
        //Remove zip puller caching for all items within this Zip
        delete inFlightPullers[location];
    }

    static GetOrFindAsyncPuller(location: string) {
        if (inFlightPullers[location]) {
            return inFlightPullers[location];
        }
        return new AsyncZipPuller(location);
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
                return await AsyncZipPuller.getZippedFile(assetPath, dataType, fileName, preloadedData);
            }
        }

        //Get general payload from Backend (covers all items in zip)
        var inFlightPuller = inFlightPullers[assetPath];
        if (inFlightPuller === null || inFlightPuller === undefined) {
            inFlightPuller = new AsyncZipPuller(assetPath,bIgnoreCache);
        }
        await inFlightPuller.GetFinishedPromise();

        //Return specific item requested (eg file 0)
        return await AsyncZipPuller.getZippedFile(assetPath, dataType, fileName);
    }

    static async getZippedFile(path:string,dataType:AsyncDataType,fileName:string, data = undefined) :Promise<any> {
        const manager = AsyncAssetManager.GetAssetManager();
        if(manager.webWorker !== undefined) {
            if(manager.printDebugStatements) {
                console.log(`$${asyncAssetLogIdentifier} Making zip request for ${path} - ${fileName}`)
            }
            const request:ZipWorkerDirective = {
                zipLoadPath:path,
                loadType:dataType,
                desiredFile:fileName
            }
            manager.webWorker.postMessage(request);
            const result = await WaitForObservable(manager.onWebWorkerCompleteUnzip,(res)=>{return res.zipDirective.zipLoadPath === path && res.zipDirective.desiredFile === fileName;},100000);
            return result.data;
        } else {
            var preloadedData = data === undefined ? await AsyncZipPuller.GetCachedFile(path) : data;
            return await GetZippedFile(preloadedData.data,dataType,fileName);
        }
    }

    static async GetCachedFile(assetFullPath: string) {
        var manager = AsyncAssetManager.GetAssetManager();
        const lastUpdateTime = manager.fileLastUpdateTimes[assetFullPath];
        var cachedResult = await manager.frontendCache.Get(assetFullPath);
        if (cachedResult !== undefined && cachedResult !== null) {
            if(lastUpdateTime === undefined || cachedResult.metadata.timestamp > lastUpdateTime) {
                if(AsyncAssetManager.GetAssetManager().printDebugStatements) {
                    console.log(`${asyncAssetLogIdentifier} Cached version current for ${assetFullPath} Last update time: ${lastUpdateTime} our cache time: ${cachedResult.metadata.timestamp}`)
                }
                return cachedResult;
            } else {
                if(AsyncAssetManager.GetAssetManager().printDebugStatements) {
                    console.log(`${asyncAssetLogIdentifier} Cached last update too old for ${assetFullPath}`)
                }
            }
        }
        return null;
    }
}
