import { InspectableType, TransformNode } from "@babylonjs/core";
import { DebugMode, environmentVaraibleTracker } from "../../../Shared/src/Utils/EnvironmentVariableTracker";
import { AsyncAssetManager } from "@BabylonBurstCore/AsyncAssets";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";

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
                    console.log("Wiping database");
                    AsyncAssetManager.GetAssetManager().frontendCache.WipeDatabase();
                },
                type: InspectableType.Button,
            },
        ];
    }

    debugLayerSetup = false;
    async setupDebugLayer() {
        if (this.debugLayerSetup) {
            return;
        }
        await import("@babylonjs/core/Debug/debugLayer");
        await import("@babylonjs/inspector");
        this.debugLayerSetup = true;
    }

    PerformTick(ecosystem: GameEcosystem): void {
        if (this.debugLayerSetup === false) {
            return;
        }
        if (ecosystem.InputValues.OPENEDITORINSPECTOR && ecosystem.InputValues.OPENEDITORINSPECTOR.wasJustActivated()) {
            if (ecosystem.scene.debugLayer.isVisible()) {
                ecosystem.scene.debugLayer.hide();
            } else {
                ecosystem.scene.debugLayer.show({});
                ecosystem.scene.debugLayer.select(this);
                CopyStyles(document, ecosystem.doc);
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

function CopyStyles(sourceDoc: Document, targetDoc: Document) {
    if (sourceDoc === targetDoc) {
        return;
    }

    for (let index = 0; index < sourceDoc.styleSheets.length; index++) {
        const styleSheet = sourceDoc.styleSheets[index];
        try {
            if (styleSheet.cssRules) {
                // for <style> elements
                const newStyleEl = sourceDoc.createElement("style");

                for (const cssRule of styleSheet.cssRules) {
                    if (cssRule.cssText.includes("actionTabs")) {
                    }
                    // write the text of each rule into the body of the style element
                    newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                }

                targetDoc.head.appendChild(newStyleEl);
            } else if (styleSheet.href) {
                // for <link> elements loading CSS from a URL
                const newLinkEl = sourceDoc.createElement("link");

                newLinkEl.rel = "stylesheet";
                newLinkEl.href = styleSheet.href;
                targetDoc.head.appendChild(newLinkEl);
            }
        } catch (e) {}
    }
}
