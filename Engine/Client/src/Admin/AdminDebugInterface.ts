import { InspectableType, TransformNode } from "@babylonjs/core";
import { DebugMode, environmentVaraibleTracker } from "../Utils/EnvironmentVariableTracker";
import { GameEcosystem } from "../GameEcosystem";
import { AsyncAssetManager } from "../AsyncAssets";


/** A Debug interface based on a node. Simply press ` to open inspector then navigate to "ADMINDEBUGOBJECT" to access the useful methods */
export class AdminDebugInterface extends TransformNode {
    constructor(name: any, scene: any) {
        super(name, scene);
        this.setupAdminInterface();
    }

    setupAdminInterface() {
        this.setupDebugLayer();

        this.inspectableCustomProperties = [
            {
                label: "Logging Level",
                propertyName: "LogLevel",
                options: [
                    { label: "None", value: 0 },
                    { label: "Light", value: 1 },
                    { label: "Heavy", value: 2 },
                    { label: "Extreme", value: 3 },
                ],
                // @ts-ignore  (Because Babylon will auto detect the level)
                callback: (option: any) => {
                    environmentVaraibleTracker.debugOverride = option;
                    console.log("Log Level changed to: " + DebugMode[environmentVaraibleTracker.GetDebugMode()]);
                },
                type: InspectableType.Options,
            },
            //Wipe IndexDB
            {
                label: "Wipe Async Cache",
                propertyName: "wipeIndexDB",
                callback: () => {
                    AsyncAssetManager.GetAssetManager().frontendCache.WipeDatabase();
                },
                type: InspectableType.Button,
            },
        ];
    }

    debugLayerSetup = false;
    async setupDebugLayer() {
        await import("@babylonjs/core/Debug/debugLayer");
        await import("@babylonjs/inspector");
        this.debugLayerSetup = true;
    }

    PerformTick(ecosystem: GameEcosystem): void {
        if (this.debugLayerSetup === false) {
            return;
        }
        if (ecosystem.InputValues.tilde.wasJustActivated()) {
            if (ecosystem.scene.debugLayer.isVisible()) {
                ecosystem.scene.debugLayer.hide();
            } else {
                ecosystem.scene.debugLayer.show({});
                ecosystem.scene.debugLayer.select(this);
            }
        }
    }
}

var adminInterface: AdminDebugInterface;

export function UpdateAdminInterface(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties["adminInterface"] === undefined) {
        ecosystem.dynamicProperties["adminInterface"] = new AdminDebugInterface("DEBUGADMIN", ecosystem.scene);
    }
    ecosystem.dynamicProperties["adminInterface"].PerformTick(ecosystem);
}
