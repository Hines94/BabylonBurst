import { Observable } from "@babylonjs/core";
import { AsyncDataType, GetAssetFullPath, GetZipPath } from "../Utils/ZipUtils.js";
import { AsyncAssetManager } from "./AsyncAssetManager.js";
import { AsyncZipPuller } from "./AsyncZipPuller.js";

/*
 * The classes below allow us to download a zip compressed asset from cloud and cache it for quick/easy retrieval later.
 * Specific functionality is contained in child classes (eg mesh creation etc).
 */

//Loaded examples in memory (First only!) (with meshes etc preloaded)
var loadedAssets: { [id: string]: AsyncAssetLoader } = {};
//Assets that are currently in the process of loading
var currentlyLoadingAssets: { [id: string]: number } = {};
const onCurrentlyLoadingAssetsChange = new Observable<string>();

/** For standard unmodified search paths */
export function GetPreviouslyLoadedAWSAsset(path: string, fileName: string): AsyncAssetLoader {
    const zipPath = GetAssetFullPath(path, fileName);
    if (loadedAssets[zipPath] !== undefined && loadedAssets[zipPath] !== null) {
        return loadedAssets[zipPath];
    }
    return null;
}

/** For custom paths (eg. scene loader) */
export function GetPreviouslyLoadedAWSAssetCustomPath(path: string): AsyncAssetLoader {
    if (loadedAssets[path] !== undefined && loadedAssets[path] !== null) {
        return loadedAssets[path];
    }
    return null;
}

export function WipePreviouslyLoadedAsyncAssets() {
    //TODO delete existing?
    loadedAssets = {};
}

/** Easy function so we can see what assets are currently in the loading process */
export function AwaitForAllAsyncAssetsToLoad(): Promise<null> {
    return new Promise((resolve, reject) => {
        if (Object.keys(currentlyLoadingAssets).length === 0) {
            resolve(null);
        } else {
            onCurrentlyLoadingAssetsChange.add(function () {
                const keys = Object.keys(currentlyLoadingAssets);
                if (keys.length === 0) {
                    resolve(null);
                }
            });
        }
    });
}

/** All asssets that are currently in an Async loading state  */
export function GetCurrentlyLoadingAsyncAssets(): { [id: string]: number } {
    return currentlyLoadingAssets;
}

/**
 * The root class for async loading in AWS assets. Is abstract so should be overriden by specific loaders.
 */
export abstract class AsyncAssetLoader {
    /** If set to true then our frontend cache will be ignored */
    ignoreCache = false;
    requestedAssetPath: string;
    AssetFullyLoaded = false;
    AssetStartedLoading = false;
    onAssetFullyLoaded = new Observable<AsyncAssetLoader>();

    startLoadTime: number;
    desiredFileName: string;
    loadedAsyncData: any;

    abstract GetDataLoadType(): AsyncDataType;

    static GetPreviouslyLoadedAsset(assetPath: string, fileName: string) {
        return GetPreviouslyLoadedAWSAsset(assetPath,fileName);
    }

    constructor(assetPath: string, fileName: string, startLoad = true, ignoreCache = false) {
        this.ignoreCache = ignoreCache;
        this.requestedAssetPath = GetZipPath(assetPath);
        this.desiredFileName = fileName;
        if (startLoad === true) {
            this.performAsyncLoad();
        }
    }

    async performAsyncLoad() {
        if (this.AssetStartedLoading === true) {
            await this.getWaitForFullyLoadPromise();
            return;
        }
        this.AssetStartedLoading = true;
        const manager = AsyncAssetManager.GetAssetManager();
        if (manager.printDebugStatements) {
            console.log("Requested asset at path: " + this.requestedAssetPath);
        }

        const ourAssetPath = this.GetAssetFullPath();
        IncrementCurrentlyLoadingAssets(ourAssetPath, manager);
        //If first then cache in case we want to perform a get unique
        const priorLoad = GetPreviouslyLoadedAWSAsset(this.requestedAssetPath, this.desiredFileName);
        //Can use data from existing asset?
        if (priorLoad !== null) {
            await priorLoad.getWaitForFullyLoadPromise();
            this.loadedAsyncData = priorLoad.loadedAsyncData;
            await this.PerformSpecificSetup(this.loadedAsyncData);
            console.log("found existing asset data for: " + this.requestedAssetPath);
            return;
        } else {
            loadedAssets[ourAssetPath] = this;
        }

        if (manager.printDebugStatements) {
            this.startLoadTime = performance.now();
        }

        //Get the data we are looking for and perform load
        this.loadedAsyncData = await AsyncZipPuller.LoadFileData(
            this.requestedAssetPath,
            this.desiredFileName,
            this.GetDataLoadType(),
            this.ignoreCache
        );

        if (manager.printDebugStatements) {
            const loadTime = (performance.now() - this.startLoadTime) / 1000;
            console.log("Asset loaded: " + this.requestedAssetPath + " load time: " + loadTime + "s");
        }

        DecrementCurrentlyLoadingAssets(ourAssetPath, manager);

        await this.PerformSpecificSetup(this.loadedAsyncData);
    }

    static RemovePriorCaching(location: string, fileName: string) {
        const fullPath = GetAssetFullPath(location, fileName);
        delete loadedAssets[fullPath];
    }

    /** Will load in our string data ahead of time */
    async PerformBackgroundCache() {
        await AsyncZipPuller.LoadFileData(
            this.requestedAssetPath,
            this.desiredFileName,
            this.GetDataLoadType(),
            this.ignoreCache
        );
    }

    GetAssetFullPath(): string {
        return GetAssetFullPath(this.requestedAssetPath, this.desiredFileName);
    }

    async PerformSpecificSetup(response: any) {
        await this.onAsyncDataLoaded(response);
        this.AssetFullyLoaded = true;
        this.onAssetFullyLoaded.notifyObservers(this);
    }

    getWaitForFullyLoadPromise(): Promise<AsyncAssetLoader> {
        var loader = this;
        return new Promise((resolve, reject) => {
            if (loader.AssetFullyLoaded === true) {
                resolve(loader);
            } else {
                loader.onAssetFullyLoaded.add(function () {
                    resolve(loader);
                });
            }
        });
    }

    //---------------------OVERRIDE METHODS---------------------------
    //When we get our data back and ready to process
    abstract onAsyncDataLoaded(cachedResponse: any): Promise<null>;
}

function IncrementCurrentlyLoadingAssets(ourAssetPath: string, manager: AsyncAssetManager) {
    if (currentlyLoadingAssets[ourAssetPath] === undefined) {
        currentlyLoadingAssets[ourAssetPath] = 0;
        onCurrentlyLoadingAssetsChange.notifyObservers(ourAssetPath);
        if (manager.printDebugStatements) console.log("Asset: " + ourAssetPath + " Started Loading");
    }
    currentlyLoadingAssets[ourAssetPath] += 1;
}
function DecrementCurrentlyLoadingAssets(ourAssetPath: string, manager: AsyncAssetManager) {
    if (currentlyLoadingAssets[ourAssetPath] === undefined) {
        return;
    }
    currentlyLoadingAssets[ourAssetPath] -= 1;
    if (currentlyLoadingAssets[ourAssetPath] === 0) {
        delete currentlyLoadingAssets[ourAssetPath];
        onCurrentlyLoadingAssetsChange.notifyObservers(ourAssetPath);
        if (manager.printDebugStatements) console.log("ASSET: " + ourAssetPath + " FINISHED LOADING");
    }
}
