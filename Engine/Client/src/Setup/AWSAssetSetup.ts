import {
    AsyncAWSBackend,
    AsyncAssetManager,
    AsyncInMemoryFrontend,
    AsyncIndexDBFrontend,
} from "@BabylonBurstCore/AsyncAssets";
import { GetAllZippedFileDatas } from "@BabylonBurstCore/AsyncAssets/Utils/ZipUtils";
import { DebugMode, environmentVaraibleTracker } from "@BabylonBurstCore/Utils/EnvironmentVariableTracker";

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
    if (environmentVaraibleTracker.GetVariable("USE_MEMORY_FRONTEND") !== "true") {
        frontend = new AsyncIndexDBFrontend(environmentVaraibleTracker.GetGameName());
    }
    console.log("BUCKET: " + environmentVaraibleTracker.GetVariable("AWS_BUCKET_NAME"));
    const assetManager = new AsyncAssetManager(
        new AsyncAWSBackend(environmentVaraibleTracker.GetVariable("AWS_BUCKET_NAME"), creds),
        frontend,
    );
    assetManager.printDebugStatements = environmentVaraibleTracker.GetDebugMode() >= DebugMode.Heavy;
    await assetManager.loadManager();
}
