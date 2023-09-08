import { unzip } from "unzipit";
import { IFrontendStorageInterface } from "../Framework/StorageInterfaceTypes";

export enum AsyncDataType {
    string,
    arrayBuffer,
    blob,
    json,
}

export function GetZipPath(path: string) {
    var zipPath = path;
    if (zipPath.includes(".zip") === false) {
        zipPath = path + ".zip";
    }
    return zipPath;
}

export function GetAssetFullPath(path: string, fileIndex: number) {
    var zipPath = GetZipPath(path);
    zipPath = fileIndex.toFixed(0) + "_" + zipPath;
    return zipPath;
}

/** Returns number of files */
export async function UnzipAndCacheData(
    zipBytes: Uint8Array,
    frontendCache: IFrontendStorageInterface,
    loadType: AsyncDataType,
    filePath: string
): Promise<number> {
    // //Perform our deflate (best we can do on javascript - tried Brotli & LZMA libraries for many hours but no good libs)
    const { entries } = await unzip(zipBytes);
    //Add all found files to cache for offline etc
    //NOTE: This assumes that all files are of the same type!
    var success = true;
    var i = 0;
    for (const [name, entry] of Object.entries(entries)) {
        //allow specify type of file (text, blob etc)
        var data = null;
        if (loadType === AsyncDataType.string) {
            data = await entry.text();
        } else if (loadType === AsyncDataType.arrayBuffer) {
            data = await entry.arrayBuffer();
        } else if (loadType === AsyncDataType.blob) {
            data = await entry.blob();
        } else {
            data = await entry.json();
        }
        if ((await frontendCache.Put(data, GetAssetFullPath(filePath, i))) === false) {
            success = false;
        }
        i++;
    }
    return i;
}
