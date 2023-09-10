import { MateralDescription } from "@engine/Materials/MaterialDescription";
import { PBRMaterialShader } from "@engine/Materials/PBRMaterialShader";

var setDefault = false;

export function SetupDefaultMaterialDescriptions() {
    if (!setDefault) {
        RegisterMaterialDescription(new PBRMaterialShader());
        setDefault = true;
    }
}

var MaterialDescriptions: MateralDescription[] = [];

export function GetMaterialDescriptions(): MateralDescription[] {
    SetupDefaultMaterialDescriptions();
    return MaterialDescriptions;
}

export function RegisterMaterialDescription(desc: MateralDescription) {
    MaterialDescriptions.push(desc);
}
