import { mouseOverCanvas } from "@BabylonBurstClient/InputModule";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { GameEcosystem } from "@engine/GameEcosystem";

//Is the mouse hovered over GUI?
var hoveredOverGUIOverride = false;

const dynamicAllAdvancedTextureProperties = "___ALLADVANCEDTEXTURES___";

export function AddAdvancedDynamicTextureToTrack(adv: AdvancedDynamicTexture, ecosystem: GameEcosystem) {
    if (!ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties]) {
        ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties] = [];
    }
    ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties].push(adv);
}

export function setHoveredOverGUIOverride(override: boolean) {
    hoveredOverGUIOverride = override;
}

export function HoveredOverGUI(ecosystem: GameEcosystem): boolean {
    return hoveredOverGUIOverride || onAdvancedTextureGUI(ecosystem) || !ecosystem.dynamicProperties[mouseOverCanvas];
}

function onAdvancedTextureGUI(ecosystem: GameEcosystem): boolean {
    if (!ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties]) {
        return false;
    }
    for (var i = 0; i < ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties].length; i++) {
        if (ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties]._shouldBlockPointer) {
            return true;
        }
    }
    return false;
}

export function removeAdvancedTexture(tex: AdvancedDynamicTexture, ecosystem: GameEcosystem) {
    ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties] = ecosystem.dynamicProperties[
        dynamicAllAdvancedTextureProperties
    ].allAdvancedTextures.filter(function (obj: AdvancedDynamicTexture) {
        return obj !== tex;
    });
}

export function UpdateDynamicTextureChecks(ecosystem: GameEcosystem) {
    //Check if hovered for clicking etc
    ecosystem.hoveredOverGUI = HoveredOverGUI(ecosystem);
    //Check if adv control has focus
    ecosystem.controlHasFocus = false;
    if (!ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties]) {
        return;
    }
    ecosystem.dynamicProperties[dynamicAllAdvancedTextureProperties].forEach((cont: AdvancedDynamicTexture) => {
        if (cont.focusedControl && cont.focusedControl !== null) {
            ecosystem.controlHasFocus = true;
        }
    });
}
