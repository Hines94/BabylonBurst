import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  _Object,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import JSZip from "jszip";
import {
  BackendSetup,
  FileZipData,
  IBackendStorageInterface,
} from "./StorageInterfaceTypes";

async function createZip(data: FileZipData[], filename: string) {
  const zip = new JSZip();
  for (var i = 0; i < data.length; i++) {
    zip.file(i + "_" + filename, data[i]);
  }
  const content = await zip.generateAsync({ type: "uint8array" });
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
      response.Contents.forEach((f) => {
        ret.push(f.Key);
      });
      return ret;
    } catch (error: any) {
      console.error(`Error listing files: ${error.message}`);
      return [];
    }
  }

  async StoreDataAtLocation(
    data: string,
    location: string,
    extension: string
  ): Promise<boolean> {
    const uploadParams = {
      Bucket: this.bucketName,
      Key: location + extension,
      Body: data,
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

  async StoreZipAtLocation(
    data: FileZipData[],
    location: string,
    extension: string
  ): Promise<boolean> {
    const zipData = await createZip(data, "babylonBoostUpload" + extension);
    const compressedBlob = new Blob([zipData], { type: "application/zip" });
    const uploadParams = {
      Bucket: this.bucketName,
      Key: location + ".zip",
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
      storage.s3.send(
        request,
        //our callback for after S3 has done its thing
        async function (err: any, data: any) {
          if (err !== null) {
            //TODO offline here??
            console.error("Error fetching async data asset: " + err);
            reject(null);
          } else {
            //Wait for our data to complete and send
            resolve(await data["Body"].transformToByteArray());
          }
        }
      );
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

  deleteObject(objectPath: string): Promise<boolean> {
    var storage = this;
    return new Promise((resolve, reject) => {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: storage.bucketName,
        Key: objectPath,
      });
      storage.s3.send(
        deleteCommand,
        //our callback for after S3 has done its thing
        async function (err: any, data: any) {
          if (err !== null) {
            console.error("Error deleting asset: " + err);
            reject(false);
          } else {
            console.log(data);
            //Wait for delete to finish
            resolve(true);
          }
        }
      );
    });
  }
}
