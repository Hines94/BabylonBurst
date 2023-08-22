
import { AsyncAWSBackend, AsyncAssetManager, AsyncDataType, AsyncInMemoryFrontend, AsyncIndexDBFrontend, AsyncZipPuller } from "../AsyncAssets";
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
        identityPoolId: "ap-southeast-2:a4d396b9-e557-4a8c-af6b-6e87ba912930",
        clientConfig: { region: "ap-southeast-2" },
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
    const assetManager = new AsyncAssetManager(new AsyncAWSBackend("sydney-spacefleets", creds), frontend);
    assetManager.printDebugStatements = environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light;
    await assetManager.loadManager();
    setupAWSWASMHooks(assetManager);
    console.log("Setup Async Asset Manager");
}

function setupAWSWASMHooks(manager: AsyncAssetManager) {
    //@ts-ignore
    window.RequestAwsAsset = async function (url: string, fileIndex: number, module: string) {
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
