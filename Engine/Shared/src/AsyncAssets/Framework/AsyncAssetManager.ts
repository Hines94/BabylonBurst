import { Observable } from "@babylonjs/core";
import { CacheWorkerDirective, CacheWorkerResult, CacheWorkerSetup, WebWorkerSetupMessage, WebWorkerStorageFail, WebWorkerStorageSuccess, ZipWorkerReturn } from "./CacheWorkerTypes";
import { IBackendStorageInterface, IFrontendStorageInterface } from "./StorageInterfaceTypes";
import { AsyncZipPuller } from "./AsyncZipPuller";
import { AsyncAssetLoader, AsyncDataType, GetCurrentlyLoadingAsyncAssets } from "..";

import { workerConstructor } from './CacheWorkerConstructor';
import { WaitForObservable } from "../Utils/BabylonUtils";

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
//https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

export const asyncAssetLogIdentifier = "BBAsyncAssets: ";

enum cachingStatus {
    NotRunning,
    Running,
    Complete
}

var globalAssetManager: AsyncAssetManager;

/**
 * Manages creating the storage and permissions to make easier for other objects.
 * Agnostic of scene/ecosystem etc so only require one global version.
 */
export class AsyncAssetManager {
    backendStorage: IBackendStorageInterface = null;
    frontendCache: IFrontendStorageInterface = null;
    onRefreshComplete = new Observable<null>();
    awaitingLoadProm: Promise<null> = null;
    init = false;
    printDebugStatements = false;
    fileLastUpdateTimes:{[filePath:string]:Date} = {};

    constructor(backendStorage: IBackendStorageInterface, frontendStorage: IFrontendStorageInterface) {
        if (globalAssetManager) {
            return;
        }
        globalAssetManager = this;
        this.backendStorage = backendStorage;
        this.frontendCache = frontendStorage;
    }

    /** Attempts to use frontend cache first */
    async GetItemAtLocation(location:string, bIgnoreCache = false): Promise<Uint8Array> {
        //Try get from frontend cache
        if(!bIgnoreCache && this.fileLastUpdateTimes[location] !== undefined) {
            const cachedData = await this.frontendCache.Get(location);
            if(cachedData !== undefined && cachedData.metadata.timestamp > this.fileLastUpdateTimes[location]) {
                return cachedData.data;
            }
        }

        const startLoadTime = this.printDebugStatements? performance.now() : undefined;
        //Can use a web worker to pull data?
        if (this.webWorker !== undefined) {
            if (this.printDebugStatements) {
                console.log(`${asyncAssetLogIdentifier} Passing request to web worker: ${location}`);
            }
            const directive: CacheWorkerDirective = {
                cacheLoadPath: location,
            };
            this.webWorker.postMessage(directive);
            await WaitForObservable(this.onWebWorkerCompleteCaching,(result)=>{return result.path === location},100000);
        //Else just process ourselves
        } else {
            const zipBytes = await this.backendStorage.GetItemAtLocation(location);
            if(zipBytes !== undefined && zipBytes !== null) {
                await this.frontendCache.Put({data:zipBytes,metadata:{timestamp:new Date()}}, location);
            }
        }

        //Cache should be nice and updated
        const loadedData = await this.frontendCache.Get(location);
        if(!loadedData) {
            return undefined;
        }

        if (this.printDebugStatements && loadedData) {
            const loadTime = (performance.now() - startLoadTime) / 1000;
            console.log(`${asyncAssetLogIdentifier}Time to load asset from Backend: ${location}  ${loadTime}s`);
        }
        return loadedData.data;
    }  

    /** Will delete in both front and backend */
    async DeleteItem(location:string) {
        await this.frontendCache.Delete(location);
        return await this.backendStorage.DeleteItemAtLocation(location);
    }

    static GetAssetManager(): AsyncAssetManager {
        return globalAssetManager;
    }

    static CreateAssetManager(backendStorage:IBackendStorageInterface,frontendStorage:IFrontendStorageInterface) {
        if(globalAssetManager) {
            return;
        }
        new AsyncAssetManager(backendStorage,frontendStorage);
    }

    async loadManager() {
        //Waiting promise so others don't run the same code also!
        if (this.awaitingLoadProm !== null) {
            return this.awaitingLoadProm;
        }

        //Require first time setup?
        if (this.init === false) {
            //Promise so others are not running the same code
            var manager = this;
            this.awaitingLoadProm = new Promise((resolve, reject) => {
                manager.onRefreshComplete.add(function () {
                    resolve(null);
                });
            });

            //Setup backend
            await this.backendStorage.InitializeBackend();

            await this.LoadWebWorker();

            this.fileLastUpdateTimes = await this.backendStorage.GetAllBackendLastSaveTimes();

            //Setup frontend cache
            await this.frontendCache.InitializeFrontendCache();

            //Finish up
            this.onRefreshComplete.notifyObservers(null);
            this.awaitingLoadProm = null;
            this.init = true;

            console.log(`Async asset manager finished loading. Using web worker: ${this.webWorker !== undefined}`);
        }

        return null;
    }

    //Go into backend and pre-cache a set of assets so we can easily download at a later date
    async preCacheFolderOfAssets(folderPath: string) {
        //TODO
        //TODO let us know that it is still loading!
    }

    //Wait at start level so we know we have all relevant content
    getAssetsWaitingToPopulate(): boolean {
        //TODO
        return false;
    }

    cachingStatus = cachingStatus.NotRunning;
    lastCacheFile = -1;
    /** We will download any assets that have not been downloaded thus far */
    UpdateAssetCache() {
        if(Object.keys(GetCurrentlyLoadingAsyncAssets()).length > 0) {
            return;
        }
        //Completed caching?
        if(this.cachingStatus !== cachingStatus.NotRunning) {
            return;
        }
        //Cache next file
        this.lastCacheFile++;
        const keys = Object.keys(this.fileLastUpdateTimes);
        if(this.lastCacheFile >= keys.length) {
            if (this.printDebugStatements) console.log(`${asyncAssetLogIdentifier} All files cached from backend`)
            this.cachingStatus = cachingStatus.Complete;
            return;
        }
        const fileToCache = keys[this.lastCacheFile];
        this.performFileCache(fileToCache);
    }

    async performFileCache(fileToCache:string) {
        if (this.printDebugStatements) console.log(`${asyncAssetLogIdentifier} Started caching: ${fileToCache}`);
        this.cachingStatus = cachingStatus.Running;
        await this.GetItemAtLocation(fileToCache,false);
        this.cachingStatus = cachingStatus.NotRunning;
    }


    // ----------------------- WEB WORKER ----------------------------------------
    webWorker: Worker;
    webWorkerStarted = false;
    onWebWorkerStarted = new Observable();
    /** Returns the path which was successful */
    onWebWorkerCompleteCaching = new Observable<CacheWorkerResult>();
    /** Returns when an unzipping has been completed */
    onWebWorkerCompleteUnzip = new Observable<ZipWorkerReturn>();

    GetWebWorkerLoadedPromise() {
        var loader = this;
        return new Promise((resolve, reject) => {
            if (loader.webWorkerStarted === true) {
                resolve(loader);
            } else {
                loader.onWebWorkerStarted.add(function () {
                    resolve(loader);
                });
            }
        });
    }

    async LoadWebWorker() {
        if (this.webWorker !== undefined) {
            return this.webWorker;
        }
        //Setup new one?
        const frontend = this.frontendCache.GetWebWorkerSetup();
        const backend = this.backendStorage.GetWebWorkerSetup();
        if (frontend !== undefined && backend !== undefined) {
            if (this.printDebugStatements) {
                console.log(`${asyncAssetLogIdentifier} Building asset management web worker`);
            }

            this.webWorker = workerConstructor();
            const setup: CacheWorkerSetup = {
                setup: true,
                backend: backend,
                frontend: frontend,
            };
            this.webWorker.postMessage(setup);
            const manager = this;
            this.webWorker.onmessage = function (e) {
                manager.processWebWorkerMessage(e);
            };
        }
        //Wait for setup complete
        if (this.webWorker !== undefined) {
            await this.GetWebWorkerLoadedPromise();
        }
        return this.webWorker;
    }

    processWebWorkerMessage(message:MessageEvent<any>) {
        const typeMessage = typeof(message.data);
        if(typeMessage === "string") {
            if (message.data === WebWorkerSetupMessage) {
                this.webWorkerStarted = true;
                this.onWebWorkerStarted.notifyObservers(undefined);
            }else if (message.data.includes(WebWorkerStorageSuccess)) {
                const res = message.data.split(":__", 2);
                this.onWebWorkerCompleteCaching.notifyObservers({
                    path: res[1],
                    success: true,
                });
            } else if (message.data.includes(WebWorkerStorageFail)) {
                const res = message.data.split(":__", 2);
                console.error(`${asyncAssetLogIdentifier} Failure for storage at path: res[1]`);
                this.onWebWorkerCompleteCaching.notifyObservers({
                    path: res[1],
                    success: false,
                });
            }

            if (this.printDebugStatements) console.log(`${asyncAssetLogIdentifier} Recived web worker message: ${message.data}`);

        } else if (typeMessage === "object") {
            if(typeof message.data === "object" && message.data.zipDirective !== undefined) {
                //Blob data needs to be unloaded from arraybuffer!
                const zipFinish = message.data as ZipWorkerReturn;
                if(zipFinish.zipDirective.loadType === AsyncDataType.blob) {
                    zipFinish.data = new Blob([zipFinish.data],{type:zipFinish.blobType});
                }
                
                this.onWebWorkerCompleteUnzip.notifyObservers(zipFinish);
                if (this.printDebugStatements) console.log(`${asyncAssetLogIdentifier} Web worker zip load finished: ${zipFinish.zipDirective.zipLoadPath}`);
            } 
        }
    }

    // ----------------------- WEB WORKER END ----------------------------------------

    /** Remove frontend cache (loaded asset) and backend cache (bytes) */
    async ResetAnyCaching(location: string, fileName: string) {
        AsyncAssetLoader.RemovePriorCaching(location, fileName);
        this.frontendCache.Delete(location);
    }
}
