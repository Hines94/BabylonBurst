import { ZipEntry, unzip } from "unzipit";
import { IFrontendStorageInterface } from "../Framework/StorageInterfaceTypes";

export type ZippedEntry = ZipEntry;

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

export function GetAssetFullPath(path: string, fileName: string) {
    var zipPath = GetZipPath(path);
    zipPath = fileName + "_" + zipPath;
    return zipPath;
}

export async function GetZippedFile(zipBytes: Uint8Array, loadType: AsyncDataType, desiredFile: string) {
    try {
        const { entries } = await unzip(zipBytes);
        for (const [name, entry] of Object.entries(entries)) {
            if (name !== desiredFile) {
                continue;
            }
            //allow specify type of file (text, blob etc)
            var data = null;
            if (loadType === AsyncDataType.string) {
                return await entry.text();
            } else if (loadType === AsyncDataType.arrayBuffer) {
                return await entry.arrayBuffer();
            } else if (loadType === AsyncDataType.blob) {
                return await entry.blob();
            } else {
                return await entry.json();
            }
        }
        return null;
    } catch {
        return null;
    }
}

export async function GetNumberFilesFromZipped(zipBytes: Uint8Array): Promise<number> {
    const { entries } = await unzip(zipBytes);
    return Object.entries(entries).length;
}

export async function GetAllZippedFileDatas(zipBytes: Uint8Array): Promise<{ name: string; entry: ZipEntry }[]> {
    const { entries } = await unzip(zipBytes);
    var ret: { name: string; entry: ZipEntry }[] = [];
    for (const [name, entry] of Object.entries(entries)) {
        ret.push({ name: name, entry: entry });
    }
    return ret;
}
