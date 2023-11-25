import { IBackendStorageInterface } from "@BabylonBurstCore/AsyncAssets";

/**Could be a folder, bundle or content item*/
export abstract class VisualItem {
    name: string;
    lastModified: Date;
    storedBackend: IBackendStorageInterface;

    abstract SaveItemOut(): Promise<boolean>;

    abstract DeleteItem(): Promise<boolean>;
}
