import { Observable } from "@babylonjs/core";
import { CacheWorkerResult, CacheWorkerSetup } from "./CacheWorkerTypes";
import path from "path";
import { IBackendStorageInterface, IFrontendStorageInterface } from "./StorageInterfaceTypes";
import { AsyncZipPuller } from "./AsyncZipPuller";
import { AsyncAssetLoader } from "..";

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
//https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

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

    constructor(backendStorage: IBackendStorageInterface, frontendStorage: IFrontendStorageInterface) {
        if (globalAssetManager) {
            return;
        }
        globalAssetManager = this;
        this.backendStorage = backendStorage;
        this.frontendCache = frontendStorage;
    }

    async GetItemAtLocation(location:string): Promise<Uint8Array> {
        const cachedData = await this.frontendCache.Get(location);
        if(cachedData !== undefined) {
            return cachedData;
        }
        return await this.backendStorage.GetItemAtLocation(location);
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

            //Setup frontend cache
            await this.frontendCache.InitializeFrontendCache();

            //Finish up
            this.onRefreshComplete.notifyObservers(null);
            this.awaitingLoadProm = null;
            this.init = true;
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

    webWorker: Worker;
    webWorkerStarted = false;
    onWebWorkerStarted = new Observable();
    /** Returns the path which was successful */
    onWebWorkerCompleteCaching = new Observable<CacheWorkerResult>();

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

    async GetWebWorker() {
        if (this.webWorker !== undefined) {
            return this.webWorker;
        }
        //Setup new one?
        const frontend = this.frontendCache.GetWebWorkerSetup();
        const backend = this.backendStorage.GetWebWorkerSetup();
        if (frontend !== undefined && backend !== undefined) {
            if (this.printDebugStatements) console.log("STARTING WEB WORKER");
            const workerPath = path.resolve(__dirname, "./CacheWorker.js");
            this.webWorker = new Worker(workerPath, { type: "module" });
            const setup: CacheWorkerSetup = {
                setup: true,
                backend: backend,
                frontend: frontend,
            };
            this.webWorker.postMessage(setup);
            const manager = this;
            this.webWorker.onmessage = function (e) {
                if (e.data === "WEB WORKER SETUP COMPLETE") {
                    manager.webWorkerStarted = true;
                    manager.onWebWorkerStarted.notifyObservers(undefined);
                } else if (e.data.includes("STORAGESUCCESS__")) {
                    const res = e.data.split("__", 2);
                    manager.onWebWorkerCompleteCaching.notifyObservers({
                        path: res[1],
                        success: true,
                    });
                } else if (e.data.includes("STORAGEFAIL__")) {
                    const res = e.data.split("__", 2);
                    console.log("Failure for storage at path: " + res[1]);
                    manager.onWebWorkerCompleteCaching.notifyObservers({
                        path: res[1],
                        success: false,
                    });
                }
                if (manager.printDebugStatements) console.log("WEB WORKER MESSAGE: " + e.data);
            };
        }
        //Wait for setup complete
        if (this.webWorker !== undefined) {
            await this.GetWebWorkerLoadedPromise();
        }
        return this.webWorker;
    }

    /** Remove frontend cache (loaded asset) and backend cache (bytes) */
    async ResetAnyCaching(location: string, fileName: string) {
        AsyncZipPuller.RemoveCacheAtLocation(location);
        AsyncAssetLoader.RemovePriorCaching(location, fileName);
        this.frontendCache.RemoveCacheAtLocation(location);
    }
}
