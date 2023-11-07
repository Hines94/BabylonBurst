import { AsyncDataType } from "..";
import { AWSSetupParams } from "./AsyncAWSBackend";
import { IndexDBSetup } from "./AsyncIndexDBFrontend";
import {
    BackendSetup,
    FrontendSetup,
    IBackendStorageInterface,
    IFrontendStorageInterface,
} from "./StorageInterfaceTypes";

export const WebWorkerSetupMessage = "Web worker setup complete";
export const WebWorkerStorageSuccess = "Storage complete:__"; //:__ required to split out data path
export const WebWorkerStorageFail = "Storage fail:__"; //:__ required to split out data path
export const WebWorkerZipSuccess = "Zip load complete:__";
export const WebWorkerZipFail = "Zip load fail:__";

export type CacheWorkerResult = {
    success: boolean;
    path: string;
};

export type CacheWorkerSetup = {
    setup: boolean;
    backend: BackendSetup;
    frontend: FrontendSetup;
};

export type CacheWorkerDirective = {
    cacheLoadPath: string;
};
export type ZipWorkerDirective = {
    zipLoadPath: string;
    loadType: AsyncDataType;
    desiredFile:string;
};

export type ZipWorkerReturn = {
    zipDirective:ZipWorkerDirective;
    blobType?:string;
    data:any;
}

export function GetBackendSetup(data: BackendSetup): IBackendStorageInterface {
    var ret = undefined;
    if (data.type === "AWS") {
        ret = new AWSSetupParams(undefined, undefined);
    }
    if (ret === undefined) {
        return undefined;
    }
    Object.assign(ret, data);
    return ret.setupBackend();
}

export function GetFrontendSetup(data: FrontendSetup): IFrontendStorageInterface {
    var ret = undefined;
    if (data.type === "IndexDB") {
        ret = new IndexDBSetup();
    }
    if (ret === undefined) {
        return undefined;
    }
    Object.assign(ret, data);
    return ret.setupFrontend();
}
