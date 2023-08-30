export type FileZipData = string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream;

/** Generic backend storage interface for retrieving data from service (eg S3) */
export interface IBackendStorageInterface {
    /** General setup for backend. After this should be ready to process requests.  */
    InitializeBackend(): Promise<null>;
    /** Returns byte array promise. Location is "folder/file" */
    GetItemAtLocation(location: string): Promise<Uint8Array>;
    GetWebWorkerSetup(): BackendSetup;
    StoreZipAtLocation(data: FileZipData[], location: string, extension: string): Promise<boolean>;
    StoreDataAtLocation(data: string, location: string, extension: string): Promise<boolean>;
    GetAllBackendItems(): Promise<string[]>;
}

/** Can be sent across web workers to setup identical backend */
export abstract class BackendSetup {
    abstract type: string;
    abstract setupBackend(): IBackendStorageInterface;
}

/** Generic frontend storage for caching data retrieved from backend */
export interface IFrontendStorageInterface {
    InitializeFrontendCache(): Promise<boolean>;
    Put(data: any, path: string): Promise<boolean>;
    Get(path: string): Promise<any>;
    WipeDatabase(): Promise<boolean>;
    /** If this !== undefined then we can use a web worker to load asset in background */
    GetWebWorkerSetup(): FrontendSetup;
    RemoveCacheAtLocation(loc: string, fileIndex: number): Promise<void>;
}

/** Can be sent across web workers to setup identical frontend */
export abstract class FrontendSetup {
    abstract type: string;
    abstract setupFrontend(): IFrontendStorageInterface;
}
