import {
    GetObjectCommand,
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
    _Object,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import JSZip from "jszip";
import { BackendSetup, FileZipData, IBackendStorageInterface } from "./StorageInterfaceTypes";
import { GetZipPath } from "../Utils/ZipUtils";

async function createZip(data: FileZipData[]) {
    const zip = new JSZip();
    for (var i = 0; i < data.length; i++) {
        zip.file(data[i].name, data[i].data);
    }
    const content = await zip.generateAsync({
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
        type: "uint8array",
    });
    return content;
}

export class AWSSetupParams extends BackendSetup {
    type: string = "AWS";
    credentials: any;
    region: string;

    constructor(region: string, credentials: any) {
        super();
        this.region = region;
        this.credentials = credentials;
    }

    setupBackend(): IBackendStorageInterface {
        return new AsyncAWSBackend(this.region, this.credentials);
    }
}

export class AsyncAWSBackend implements IBackendStorageInterface {
    awaitingLoadProm: Promise<null> = null;
    s3: S3Client = null;
    bucketName: string = "";
    credentials: any = null;
    cognitoCreds: any = null;

    /** credentials are AWS credentials. region is in readable format eg sydney */
    constructor(bucketName: string, cognitoCredentials: any) {
        this.bucketName = bucketName;
        this.cognitoCreds = cognitoCredentials;
        //Root user credentials for editor work?
        if (cognitoCredentials.accessKeyId === undefined) {
            this.credentials = fromCognitoIdentityPool(cognitoCredentials);
        } else {
            this.credentials = cognitoCredentials;
        }
    }

    async GetAllBackendItems(): Promise<string[]> {
        const input = {
            Bucket: this.bucketName,
        };
        const listCommand = new ListObjectsV2Command(input);
        try {
            const response = await this.s3.send(listCommand);
            const ret: string[] = [];
            response.Contents.forEach(f => {
                ret.push(f.Key);
            });
            return ret;
        } catch (error: any) {
            console.error(`Error listing files: ${error.message}`);
            return [];
        }
    }

    async StoreDataAtLocation(data: string, location: string, extension: string): Promise<boolean> {
        const uploadParams = {
            Bucket: this.bucketName,
            Key: location + extension,
            Body: data,
        };
        try {
            const response = await this.s3.send(new PutObjectCommand(uploadParams));
            console.log(`File uploaded successfully: ${location}`);
            return true;
        } catch (error: any) {
            console.error(`Error uploading file: ${error.message}`);
            return false;
        }
    }

    async StoreZipAtLocation(data: FileZipData[], location: string): Promise<boolean> {
        const zipData = await createZip(data);
        const compressedBlob = new Blob([zipData], { type: "application/zip" });
        const uploadParams = {
            Bucket: this.bucketName,
            Key: GetZipPath(location),
            Body: compressedBlob,
            ContentType: "application/zip",
        };
        try {
            const response = await this.s3.send(new PutObjectCommand(uploadParams));
            console.log(`File uploaded successfully. ETag: ${response.ETag}`);
            return true;
        } catch (error: any) {
            console.error(`Error uploading file: ${error.message}`);
            return false;
        }
    }

    GetWebWorkerSetup(): BackendSetup {
        return new AWSSetupParams(this.bucketName, this.cognitoCreds);
    }

    /** Call init for the backend. Set s3 back to null in order to re-init with new region. */
    InitializeBackend(): Promise<null> {
        if (this.s3 === null) {
            this.s3 = new S3Client({
                region: this.getAWSRegion(this.bucketName),
                credentials: this.credentials,
            });
        }

        //No async actually required for now!
        return null;
    }

    GetItemAtLocation(location: string): Promise<Uint8Array> {
        var storage = this;
        return new Promise((resolve, reject) => {
            var request = new GetObjectCommand({
                Bucket: storage.bucketName,
                Key: location,
                ResponseCacheControl: "no-cache",
            });
            try {
                storage.s3.send(request, (err: any, data: any) => {
                    if (err !== null) {
                        console.warn("Warning: Failed to fetch async data asset: " + location); // Log a warning.
                        reject(null);
                    } else {
                        if (data.$metadata.httpStatusCode !== 200) {
                            resolve(null);
                        }
                        data["Body"]
                            .transformToByteArray()
                            .then((result: any) => resolve(result))
                            .catch((error: any) => {
                                console.warn("Warning: Failed to transform data.");
                                reject(null);
                            });
                    }
                });
            } catch (err) {
                console.warn("Warning: Error while sending s3 request for " + location);
                reject(null);
            }
        });
    }

    getAWSRegion(downloadRegion: string): string {
        if (downloadRegion === "sydney") {
            return "ap-southeast-2";
        }
        return "ap-southeast-2";
    }

    listObjects(): Promise<_Object[]> {
        var storage = this;
        return new Promise((resolve, reject) => {
            const listCommand = new ListObjectsV2Command({
                Bucket: storage.bucketName,
            });
            storage.s3.send(
                listCommand,
                //our callback for after S3 has done its thing
                async function (err: any, data: any) {
                    if (err !== null) {
                        //TODO offline here??
                        console.error("Error listing data assets: " + err);
                        reject(null);
                    } else {
                        //Wait for our data to complete and send
                        resolve(data.Contents);
                    }
                }
            );
        });
    }

    async deleteObject(objectPath: string): Promise<boolean> {
        var storage = this;
        try {
            // Construct the HeadObjectCommand
            const checkCommand = new HeadObjectCommand({
                Bucket: storage.bucketName,
                Key: objectPath,
            });

            // Send the command to check if the object exists
            await storage.s3.send(checkCommand);

            // If the object exists, construct and send the DeleteObjectCommand
            const deleteCommand = new DeleteObjectCommand({
                Bucket: storage.bucketName,
                Key: objectPath,
            });

            await storage.s3.send(deleteCommand);
            console.log(`Item deleted: ${objectPath}`);
            return true;
        } catch (error: any) {
            if (error.name === "NotFound") {
                console.warn(`Object does not exist: ${objectPath}`);
                return false; // Or reject, based on your use case
            } else {
                console.warn(`Error: ${error} ${objectPath}`);
                return false;
            }
        }
    }
}
