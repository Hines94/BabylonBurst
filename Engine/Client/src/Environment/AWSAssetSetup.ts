import {
    AsyncAWSBackend,
    AsyncAssetManager,
    AsyncDataType,
    AsyncInMemoryFrontend,
    AsyncIndexDBFrontend,
    AsyncZipPuller,
} from "../../../Shared/src/AsyncAssets";
import { DebugMode, environmentVaraibleTracker } from "../Utils/EnvironmentVariableTracker";
import { GetWasmModule } from "../WASM/ServerWASMModule";

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
    console.log("Setup Async Asset Manager");
}

function setupAWSWASMHooks(manager: AsyncAssetManager) {
    //@ts-ignore
    window.RequestAwsAsset = async function (url: string, fileIndex: number, module: string) {
        console.log("Request AWS Asset: " + url)
        const data = await AsyncZipPuller.LoadFileData(url, fileIndex, AsyncDataType.arrayBuffer, false);
        GetWasmModule(module).AwsGetItemDataCallback(data, url);
    };
    //@ts-ignore
    window.RequestAllAwsAssets = async function (module: string) {
        const allItems = await manager.backendStorage.GetAllBackendItems();
        var strArray = allItems.map(String);
        GetWasmModule(module).AwsGetAllDataCallback(strArray);
    };
}
