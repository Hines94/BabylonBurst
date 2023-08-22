import { UnzipAndCacheData } from "../Utils/ZipUtils";
import { CacheWorkerDirective, CacheWorkerSetup, GetBackendSetup, GetFrontendSetup } from "./CacheWorkerTypes";
import { IBackendStorageInterface, IFrontendStorageInterface } from "./StorageInterfaceTypes";

var frontend:IFrontendStorageInterface;
var backend:IBackendStorageInterface;


self.addEventListener('message',function(e){
    if(e.data.setup !== undefined){
        let data = e.data as CacheWorkerSetup;
        frontend = GetFrontendSetup(data.frontend);
        frontend.InitializeFrontendCache();
        backend = GetBackendSetup(data.backend);
        backend.InitializeBackend();
        this.self.postMessage("WEB WORKER SETUP COMPLETE");
    } else {
        let data = e.data as CacheWorkerDirective;
        this.self.postMessage("PROCESSING__" + data.path);
        processCacheRequest(data);
    }
})

async function processCacheRequest(data:CacheWorkerDirective){
    const bytes = await backend.GetItemAtLocation(data.path);
    const success = await UnzipAndCacheData(bytes,frontend,data.loadType,data.path);
    if(success){self.postMessage("STORAGESUCCESS__" + data.path);}
    else{self.postMessage("STORAGEFAIL__" + data.path);}
}

