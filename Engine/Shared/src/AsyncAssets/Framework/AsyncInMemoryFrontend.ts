import { GetAssetFullPath, GetZipPath } from "../Utils/ZipUtils";
import { CacheEntry, FrontendSetup, IFrontendStorageInterface } from "./StorageInterfaceTypes";

/** An easy in-memory way of storing requests downloaded from backend (AWS) */
export class AsyncInMemoryFrontend implements IFrontendStorageInterface {
    storedRequests: { [id: string]: CacheEntry } = {};

    GetWebWorkerSetup(): FrontendSetup {
        return undefined;
    }

    async InitializeFrontendCache(): Promise<boolean> {
        //No setup required!
        return true;
    }

    async Put(data: CacheEntry, path: string): Promise<boolean> {
        this.storedRequests[path] = data;
        return true;
    }

    async GetAllItemNames(): Promise<string[]> {
        return Object.keys(this.storedRequests);
    }

    async Get(path: string): Promise<CacheEntry> {
        return this.storedRequests[path];
    }

    async WipeDatabase(): Promise<boolean> {
        this.storedRequests = {};
        return true;
    }

    async Delete(path: string): Promise<boolean> {
        this.storedRequests[path] = undefined;
        return true;
    }

    async RemoveCacheAtLocation(loc: string): Promise<void> {
        delete this.storedRequests[GetZipPath(loc)];
    }
}
