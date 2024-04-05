import { environmentVaraibleTracker } from "../../Utils/EnvironmentVariableTracker";
import { GetAssetFullPath, GetZipPath } from "../Utils/ZipUtils";
import { asyncAssetLogIdentifier } from "./AsyncAssetManager";
import { CacheEntry, FrontendSetup, IFrontendStorageInterface } from "./StorageInterfaceTypes";

//TODO move this into global accessable in case we want to access from another system
var localDatabase: IDBDatabase = null;
var cacheOpeningPromise: Promise<IDBDatabase> = null;
const RequestCacheName = "CachedRequests";
 //TODO: This is hacky-instead pass in to setup?

export class IndexDBSetup extends FrontendSetup {
    storageName:string;
    type: string = "IndexDB";
    setupFrontend(): IFrontendStorageInterface {
        return new AsyncIndexDBFrontend(this.storageName);
    }
}

/** Uses indexDB to store and retrieve cached async assets */
export class AsyncIndexDBFrontend implements IFrontendStorageInterface {
    frontendCache: IDBObjectStore = null;

    indexDBName = `_CachedAssets`;
    storageName = "CHANGESTORAGENAME";

    constructor(storageName:string) {
        this.storageName = storageName;
        this.indexDBName = `${storageName}_CachedAssets`;
    }

    async GetAllItemNames(): Promise<string[]> {
        const keys= this.frontendCache.getAllKeys();
        return await new Promise((resolve, reject) => {
            keys.onsuccess = function () {
                const ret = [];
                keys.result.forEach(k=>{
                    ret.push(k.toString())
                })
                return ret;
            };
            keys.onerror = function () {
                console.error(`${asyncAssetLogIdentifier} IndexDB get keys Error: ${keys.error}`);
                reject([]);
            };
        });
    }

    async Delete(loc: string): Promise<boolean> {
        await this.OpenWriteTransaction();
        const fullPath = GetZipPath(loc);
        return this.frontendCache.delete(fullPath) === undefined;
    }

    async WipeDatabase(): Promise<boolean> {
        localDatabase.close();
        const delreq = indexedDB.deleteDatabase(this.indexDBName);
        return await new Promise((resolve, reject) => {
            delreq.onsuccess = function () {
                resolve(true);
            };
            delreq.onerror = function () {
                console.error(`${asyncAssetLogIdentifier} IndexDB delete Error: ${delreq.error}`);
                reject(false);
            };
            delreq.onblocked = function () {
                console.log(`${asyncAssetLogIdentifier} Can't delete indexDB: blocked!`);
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

    Put(data: CacheEntry, path: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.OpenWriteTransaction();
            const request = this.frontendCache.put(data, path);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
      }

      Get(path: string): Promise<CacheEntry> {
        return new Promise((resolve, reject) => {
            this.OpenReadTransaction();
            const request = this.frontendCache.get(path);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
      }

    openIndexDB(): Promise<IDBDatabase> {
        var request = indexedDB.open(this.indexDBName, 1);
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
                    console.error(`${asyncAssetLogIdentifier} implement database versioning. We need a store name that is not present!!`);
                }
            };

            //Can't even open the database. Incognito?
            request.onerror = function (event: any) {
                console.error(`${asyncAssetLogIdentifier}Error with setting up IndexDb cache database: ${event.target.errorCode}`);
                reject(null);
            };

            request.onblocked = function (event: any) {
                console.error(`${asyncAssetLogIdentifier} IndexDb cache blocked`);
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
                    console.error(`${asyncAssetLogIdentifier} IndexDB did not load in 2 seconds.`);
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
       const setup = new IndexDBSetup();
       setup.storageName = this.storageName;
       return setup;
    }
}
