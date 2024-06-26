import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { premadeLowSetting, premadeUltraSetting } from "./Utils/PremadeSettings";

export enum DownloadRegion {
    sydney,
}

/**
 * Overall game settings all contained in a handy class
 */
export class Settings {
    downloadRegion = DownloadRegion.sydney;
    //TODO: Event for change!
    hardwareScaling = 1;
    FXAASamples = 0;

    RefreshSettings(settingData: Partial<Settings>) {
        Object.assign(this, settingData);
    }

    OnSceneLoaded(ecosystem: GameEcosystem) {
        this.RefreshRendering(ecosystem);
    }

    RefreshRendering(ecosystem: GameEcosystem) {
        ecosystem.camera.setupRendering();
        ecosystem.scene.getEngine().setHardwareScalingLevel(this.GetRenderScale());
    }

    GetRenderScale() {
        return 1 / this.hardwareScaling;
    }
}

var settings = new Settings();
settings.RefreshSettings(premadeLowSetting);

/**
 * Overall game settings all contained in a handy class.
 * TODO load settings on new game
 */
export function GetGameSettings() {
    //TODO load?
    return settings;
}
