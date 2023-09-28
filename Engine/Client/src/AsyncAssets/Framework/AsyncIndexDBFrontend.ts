import { GetAssetFullPath, GetZipPath } from "../Utils/ZipUtils";
import { FrontendSetup, IFrontendStorageInterface } from "./StorageInterfaceTypes";

//TODO move this into global accessable in case we want to access from another system
var localDatabase: IDBDatabase = null;
var cacheOpeningPromise: Promise<IDBDatabase> = null;
const RequestCacheName = "CachedRequests";
const mechIndexDB = "mechCrawlerCachedAssets";

export class IndexDBSetup extends FrontendSetup {
    type: string = "IndexDB";
    setupFrontend(): IFrontendStorageInterface {
        return new AsyncIndexDBFrontend();
    }
}

/** Uses indexDB to store and retrieve cached async assets */
export class AsyncIndexDBFrontend implements IFrontendStorageInterface {
    frontendCache: IDBObjectStore = null;

    async RemoveCacheAtLocation(loc: string): Promise<void> {
        await this.OpenWriteTransaction();
        const fullPath = GetZipPath(loc);
        this.frontendCache.delete(fullPath);
    }

    async WipeDatabase(): Promise<boolean> {
        localDatabase.close();
        const delreq = indexedDB.deleteDatabase(mechIndexDB);
        return await new Promise((resolve, reject) => {
            delreq.onsuccess = function () {
                resolve(true);
            };
            delreq.onerror = function () {
                console.log(delreq.error);
                reject(false);
            };
            delreq.onblocked = function () {
                console.log("Can't delete indexDB: blocked!");
                reject(false);
            };
        });
    }

    async InitializeFrontendCache(): Promise<boolean> {
        if (cacheOpeningPromise === null) {
            cacheOpeningPromise = this.openIndexDB();
        }
        await cacheOpeningPromise;
        await this.AwaitCurrentTransaction();
        return this.frontendCache !== null;
    }
    /** Await our current put/get */
    async AwaitCurrentTransaction(): Promise<boolean> {
        var loader = this;
        if (loader.frontendCache.transaction === undefined || loader.frontendCache.transaction === null) {
            return true;
        }
        return await new Promise((resolve, reject) => {
            loader.frontendCache.transaction.oncomplete = function () {
                resolve(true);
            };
            loader.frontendCache.transaction.onerror = function () {
                reject(false);
            };
            loader.frontendCache.transaction.onabort = function () {
                reject(false);
            };
        });
    }

    async Put(data: any, path: string): Promise<boolean> {
        this.OpenWriteTransaction();
        const request = this.frontendCache.put(data, path);
        await this.AwaitCurrentTransaction();
        return request.result === path;
    }

    async Get(path: string): Promise<any> {
        this.OpenReadTransaction();
        var cached = this.frontendCache.get(path);
        await this.AwaitCurrentTransaction();
        return cached.result;
    }

    openIndexDB(): Promise<IDBDatabase> {
        var request = indexedDB.open(mechIndexDB, 1);
        var loader = this;
        return new Promise((resolve, reject) => {
            //Success! We opened the database!
            request.onsuccess = function () {
                localDatabase = request.result;
                if (request.result.objectStoreNames.contains(RequestCacheName)) {
                    loader.frontendCache = request.result
                        .transaction([RequestCacheName], "readwrite")
                        .objectStore(RequestCacheName);
                    resolve(request.result);
                } else {
                    console.error("TODO implement database versioning. We need a store name that is not present!!");
                }
            };

            //Can't even open the database. Incognito?
            request.onerror = function (event: any) {
                console.error("Error with setting up Mech Crawler cache database: " + event.target.errorCode);
                reject(null);
            };

            request.onblocked = function (event: any) {
                console.error("Mech cache blocked");
                reject(null);
            };

            //Upgrade is where we add more stores or remove them
            request.onupgradeneeded = function () {
                localDatabase = request.result;
                if (localDatabase.objectStoreNames.contains(RequestCacheName)) {
                    resolve(request.result);
                }
                loader.frontendCache = localDatabase.createObjectStore(RequestCacheName);
                resolve(request.result);
            };

            setTimeout(function () {
                if (request.readyState !== "done") {
                    console.error("Mech IndexDB did not load in 2 seconds.");
                    reject(null);
                }
            }, 2000);
        });
    }

    async OpenReadTransaction(): Promise<boolean> {
        this.frontendCache = localDatabase.transaction(RequestCacheName, "readonly").objectStore(RequestCacheName);
        return true;
    }

    async OpenWriteTransaction(): Promise<boolean> {
        this.frontendCache = localDatabase.transaction(RequestCacheName, "readwrite").objectStore(RequestCacheName);
        return true;
    }

    GetWebWorkerSetup(): FrontendSetup {
        return new IndexDBSetup();
    }
}
