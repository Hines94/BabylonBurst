import { GetAllZippedFileDatas } from "@engine/AsyncAssets/Utils/ZipUtils";
import {
    AsyncAWSBackend,
    AsyncAssetManager,
    AsyncDataType,
    AsyncInMemoryFrontend,
    AsyncIndexDBFrontend,
    AsyncZipPuller,
} from "../AsyncAssets";
import { DebugMode, environmentVaraibleTracker } from "../Utils/EnvironmentVariableTracker";
import { GetWasmModule } from "../WASM/ServerWASMModule";
import { setupGeneralWASMCallbacks } from "@engine/Setup/WASMCallbacksSetup";
import { decode } from "@msgpack/msgpack";

//Since manager is global we just check if setup
export async function setupAsyncManager() {
    //Already setup?
    if (AsyncAssetManager.GetAssetManager()) {
        return;
    }
    //Fake credentaials for now
    //TODO: Use AWS login credentials for users along with admin accounts?
    var creds: any = {
        identityPoolId: "TODO: Support Identity Pool from login!",
        clientConfig: { region: environmentVaraibleTracker.GetVariable("AWS_BUCKET_REGION") },
    };
    //Get AWS from environment if running on vite?
    if (environmentVaraibleTracker.GetVariable("AWS_ID") !== undefined) {
        creds = {
            accessKeyId: environmentVaraibleTracker.GetVariable("AWS_ID"),
            secretAccessKey: environmentVaraibleTracker.GetVariable("AWS_KEY"),
        };
    }

    //Setup scene async manager
    var frontend: any = new AsyncInMemoryFrontend();
    if (environmentVaraibleTracker.GetVariable("USE_MEMORY_FRONTEND") !== "TRUE") {
        frontend = new AsyncIndexDBFrontend();
    }
    console.log("BUCKET: " + environmentVaraibleTracker.GetVariable("AWS_BUCKET_NAME"));
    const assetManager = new AsyncAssetManager(
        new AsyncAWSBackend(environmentVaraibleTracker.GetVariable("AWS_BUCKET_NAME"), creds),
        frontend
    );
    assetManager.printDebugStatements = environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light;
    await assetManager.loadManager();
    setupAWSWASMHooks(assetManager);
    setupGeneralWASMCallbacks();
    console.log("Setup Async Asset Manager");
}

function setupAWSWASMHooks(manager: AsyncAssetManager) {
    //@ts-ignore
    window.RequestAwsAsset = async function (url: string, fileName: string, module: string) {
        console.log("Request AWS Asset: " + url);
        const data = await AsyncZipPuller.LoadFileData(url, fileName, AsyncDataType.arrayBuffer, false);
        GetWasmModule(module).AwsGetItemDataCallback(data, url);
    };
    //@ts-ignore
    window.RequestAWSBundleName = async function (url: string, module: string) {
        console.log("Request AWS Asset: " + url);
        const data = await AsyncAssetManager.GetAssetManager().backendStorage.GetItemAtLocation(url);
        const datas = await GetAllZippedFileDatas(data);
        var ret: string[] = [];
        datas.forEach(d => {
            ret.push(d.name);
        });
        GetWasmModule(module).AwsFilenamesCallback(url, ret);
    };
    //@ts-ignore
    window.RequestAllAwsAssets = async function (module: string) {
        const allItems = await manager.backendStorage.GetAllBackendItems();
        var strArray = allItems.map(String);
        GetWasmModule(module).AwsGetAllDataCallback(strArray);
    };
}
