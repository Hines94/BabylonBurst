import { GetAssetFullPath, GetZipPath } from "../Utils/ZipUtils";
import { FrontendSetup, IFrontendStorageInterface } from "./StorageInterfaceTypes";

/** An easy in-memory way of storing requests downloaded from backend (AWS) */
export class AsyncInMemoryFrontend implements IFrontendStorageInterface {
    storedRequests: { [id: string]: any } = {};

    GetWebWorkerSetup(): FrontendSetup {
        return undefined;
    }

    async InitializeFrontendCache(): Promise<boolean> {
        //No setup required!
        return true;
    }

    async Put(data: any, path: string): Promise<boolean> {
        this.storedRequests[path] = data;
        return true;
    }

    async Get(path: string): Promise<any> {
        return this.storedRequests[path];
    }

    async WipeDatabase(): Promise<boolean> {
        this.storedRequests = {};
        return true;
    }

    async RemoveCacheAtLocation(loc: string): Promise<void> {
        delete this.storedRequests[GetZipPath(loc)];
    }
}
