import * as BABYLONGUI from "@babylonjs/gui";
import { GetGameSettings } from "../../Settings";
import { DebugMode, environmentVaraibleTracker } from "../../Utils/EnvironmentVariableTracker";
import { uiLayerMask } from "../../Utils/LayerMasks";

export class FramerateCounter {
    advancedTexture = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("FramerateUI");
    averageFramesText = new BABYLONGUI.TextBlock("FramerateCount");
    lowFramesText = new BABYLONGUI.TextBlock("LowFramesCount");
    lowestFramesText = new BABYLONGUI.TextBlock("LowFramesCount");
    framesToCollect = 200;

    running = false;

    constructor() {
        this.advancedTexture.renderScale = GetGameSettings().GetRenderScale();
        this.advancedTexture.addControl(this.averageFramesText);
        this.advancedTexture.layer.layerMask = uiLayerMask;
        this.averageFramesText.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.averageFramesText.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.averageFramesText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.averageFramesText.height = "50px";
        this.averageFramesText.width = "50px";
        this.averageFramesText.color = "white";
        this.averageFramesText.outlineColor = "black";
        this.averageFramesText.outlineWidth = 3;
        this.averageFramesText.paddingRightInPixels = 10;

        this.advancedTexture.addControl(this.lowFramesText);
        this.lowFramesText.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.lowFramesText.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.lowFramesText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.lowFramesText.height = "50px";
        this.lowFramesText.width = "150px";
        this.lowFramesText.color = "red";
        this.lowFramesText.topInPixels = 20;
        this.lowFramesText.outlineColor = "black";
        this.lowFramesText.outlineWidth = 3;
        this.lowFramesText.paddingRightInPixels = 10;

        this.advancedTexture.addControl(this.lowestFramesText);
        this.lowestFramesText.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.lowestFramesText.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.lowestFramesText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.lowestFramesText.height = "50px";
        this.lowestFramesText.width = "150px";
        this.lowestFramesText.color = "red";
        this.lowestFramesText.topInPixels = 40;
        this.lowestFramesText.outlineColor = "black";
        this.lowestFramesText.outlineWidth = 3;
        this.lowestFramesText.paddingRightInPixels = 10;

        this.updateIsRunning();
    }

    private updateIsRunning() {
        if (environmentVaraibleTracker.GetDebugMode() < DebugMode.Light) {
            this.running = false;
            this.averageFramesText.isVisible = false;
            this.lowFramesText.isVisible = false;
            this.lowestFramesText.isVisible = false;
        } else {
            this.running = true;
            this.averageFramesText.isVisible = true;
            this.lowFramesText.isVisible = true;
            this.lowestFramesText.isVisible = true;
        }
    }

    recentFrames: number[] = [];

    updateFramerate(deltaTime: number) {
        if (this.running === false) {
            return;
        }
        var CalcRate = 1 / deltaTime;
        this.recentFrames.splice(0, 0, CalcRate);
        if (this.recentFrames.length > this.framesToCollect) {
            this.recentFrames = this.recentFrames.slice(0, this.framesToCollect);
        }
        //Average frames
        const average = averageArray(this.recentFrames);
        this.averageFramesText.text = average.toFixed(0);
        //Check bottom tanky frames
        const lowFract = averageArray(bottomFraction(this.recentFrames, 0.05));
        if (lowFract < 0.95 * average) {
            this.lowFramesText.isVisible = true;
            this.lowFramesText.text = "Lowest 5%: " + lowFract.toFixed(0);
        } else {
            this.lowFramesText.isVisible = false;
        }
        //Check rock bottom tanks
        const lowestFract = averageArray(bottomFraction(this.recentFrames, 0.01));
        if (lowFract < 0.9 * average) {
            this.lowestFramesText.isVisible = true;
            this.lowestFramesText.text = "Lowest 1%: " + lowestFract.toFixed(0);
        } else {
            this.lowestFramesText.isVisible = false;
        }
    }
}

function averageArray(numbers: number[]) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length || 0;
    return avg;
}

function bottomNumber(numbers: number[]): number {
    // Make a copy of the array
    const numbersCopy = [...numbers];
    numbersCopy.sort((a, b) => a - b);
    return numbersCopy[0];
}

function bottomFraction(numbers: number[], fract: number): number[] {
    // Make a copy of the array
    const numbersCopy = [...numbers];

    // Sort the numbers in ascending order
    numbersCopy.sort((a, b) => a - b);

    // Calculate the length of the bottom % of the array
    const bottomTenPercentLength = Math.ceil(numbersCopy.length * fract);

    // Return the bottom % of the numbers
    return numbersCopy.slice(0, bottomTenPercentLength);
}
