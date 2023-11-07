export type FileZipData = {
    name: string;
    data: string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream;
};

/** Generic backend storage interface for retrieving data from service (eg S3) */
export interface IBackendStorageInterface {
    /** General setup for backend. After this should be ready to process requests.  */
    InitializeBackend(): Promise<null>;
    /** Returns byte array promise. Retuns null if no data */
    GetItemAtLocation(location: string): Promise<Uint8Array>;
    GetWebWorkerSetup(): BackendSetup;
    StoreZipAtLocation(data: FileZipData[], location: string): Promise<boolean>;
    DeleteItemAtLocation(path:string): Promise<boolean>;
    StoreDataAtLocation(data: string, location: string, extension: string): Promise<boolean>;
    GetAllBackendItems(): Promise<string[]>;
    GetAllBackendLastSaveTimes():Promise<{[filename:string]:Date}>;
}

/** Can be sent across web workers to setup identical backend */
export abstract class BackendSetup {
    abstract type: string;
    abstract setupBackend(): IBackendStorageInterface;
}

/** This should be created/returned as we will require metadata about the result */
export interface CacheEntry {
    data: any;
    metadata: {
      timestamp: Date;
    };
  }

/** Generic frontend storage for caching data retrieved from backend */
export interface IFrontendStorageInterface {
    InitializeFrontendCache(): Promise<boolean>;
    Put(data: CacheEntry, path: string): Promise<boolean>;
    Get(path: string): Promise<CacheEntry>;
    Delete(path:string): Promise<boolean>;
    WipeDatabase(): Promise<boolean>;
    /** If this !== undefined then we can use a web worker to load asset in background */
    GetWebWorkerSetup(): FrontendSetup;
}

/** Can be sent across web workers to setup identical frontend */
export abstract class FrontendSetup {
    abstract type: string;
    abstract setupFrontend(): IFrontendStorageInterface;
}
