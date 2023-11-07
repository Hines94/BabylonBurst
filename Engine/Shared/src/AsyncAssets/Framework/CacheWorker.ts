import { AsyncDataType, GetZippedFile } from "../Utils/ZipUtils";
import { CacheWorkerDirective, CacheWorkerSetup, GetBackendSetup, GetFrontendSetup, WebWorkerSetupMessage, WebWorkerStorageFail, WebWorkerStorageSuccess, ZipWorkerDirective, ZipWorkerReturn } from "./CacheWorkerTypes";
import { IBackendStorageInterface, IFrontendStorageInterface } from "./StorageInterfaceTypes";


var frontend: IFrontendStorageInterface;
var backend: IBackendStorageInterface;

self.addEventListener("message", function (e) {
    if (e.data.setup !== undefined) {
        if(frontend === undefined && backend === undefined) {
            this.self.postMessage("Web worker starting");
            let data = e.data as CacheWorkerSetup;
            frontend = GetFrontendSetup(data.frontend);
            frontend.InitializeFrontendCache();
            backend = GetBackendSetup(data.backend);
            backend.InitializeBackend();
            this.self.postMessage(WebWorkerSetupMessage);
        }
    } else if(e.data.cacheLoadPath) {
        let data = e.data as CacheWorkerDirective;
        this.self.postMessage("Processing Cache Request: " + data.cacheLoadPath);
        processCacheRequest(data);
    } else if(e.data.zipLoadPath) {
        let data = e.data as ZipWorkerDirective;
        this.self.postMessage("Processing Zip Request: " + data.zipLoadPath);
        processZipRequest(data);
    }
});

async function processCacheRequest(data: CacheWorkerDirective) {
    const bytes = await backend.GetItemAtLocation(data.cacheLoadPath);
    const success = await frontend.Put({data:bytes,metadata:{timestamp:new Date()}}, data.cacheLoadPath);
    if (success) {
        self.postMessage(WebWorkerStorageSuccess + data.cacheLoadPath);
    } else {
        self.postMessage(WebWorkerStorageFail + data.cacheLoadPath);
    }
}

async function processZipRequest(data: ZipWorkerDirective) {
    const frontendData = await frontend.Get(data.zipLoadPath);
    const returnMessage:ZipWorkerReturn = {zipDirective:data,data:undefined};
    if(!frontendData) {
        self.postMessage(returnMessage);
        return;
    }
    const result = await GetZippedFile(frontendData.data,data.loadType,data.desiredFile);
    if(result === null) {
        self.postMessage(returnMessage);
    } else {
        if(data.loadType === AsyncDataType.arrayBuffer){
            returnMessage.data = result;
            self.postMessage(returnMessage,undefined,[result]);
        } else if(data.loadType === AsyncDataType.blob) {
            const arayb = await result.arrayBuffer();
            returnMessage.blobType = result.type;
            returnMessage.data = arayb;
            self.postMessage(returnMessage,undefined,[arayb]);
        } else {
            returnMessage.data = result;
            self.postMessage(returnMessage);
        }
    }
}
