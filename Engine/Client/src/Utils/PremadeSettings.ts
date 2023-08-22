import { Settings } from "../Settings";

export const premadeLowSetting: Partial<Settings> = {
    hardwareScaling: 0.9,
};

export const premadeMedSetting: Partial<Settings> = {
    hardwareScaling: 1.1,
    FXAASamples: 2,
};

export const premadeHighSetting: Partial<Settings> = {
    hardwareScaling: 1.5,
    FXAASamples: 3,
};

export const premadeUltraSetting: Partial<Settings> = {
    hardwareScaling: 2,
    FXAASamples: 4,
};
