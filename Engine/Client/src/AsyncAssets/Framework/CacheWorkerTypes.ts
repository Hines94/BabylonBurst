import { AsyncDataType } from "..";
import { AWSSetupParams } from "./AsyncAWSBackend";
import { IndexDBSetup } from "./AsyncIndexDBFrontend";
import { BackendSetup, FrontendSetup, IBackendStorageInterface, IFrontendStorageInterface } from "./StorageInterfaceTypes";

export type CacheWorkerResult = {
    success:boolean,
    path:string,
}

export type CacheWorkerSetup = {
    setup:boolean,
    backend:BackendSetup,
    frontend:FrontendSetup
}

export type CacheWorkerDirective = {
    path:string,
    loadType: AsyncDataType,
}

export function GetBackendSetup(data:BackendSetup):IBackendStorageInterface{
    var ret = undefined;
    if(data.type === "AWS"){
        ret = new AWSSetupParams(undefined,undefined);
    }
    if(ret === undefined){return undefined;}
    Object.assign(ret,data);
    return ret.setupBackend();
}

export function GetFrontendSetup(data:FrontendSetup):IFrontendStorageInterface{
    var ret = undefined;
    if(data.type === "IndexDB"){
        ret = new IndexDBSetup();
    }
    if(ret === undefined){return undefined;}
    Object.assign(ret,data);
    return ret.setupFrontend();
}