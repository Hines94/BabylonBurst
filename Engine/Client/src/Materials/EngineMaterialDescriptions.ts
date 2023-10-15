import { MateralDescription } from "@BabylonBurstClient/Materials/MaterialDescription";
import { PBRMaterialShader } from "@BabylonBurstClient/Materials/PBRMaterialShader";

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

/** Get correct material type from shader name */
export function GetMaterialDescription(shaderType: string) {
    SetupDefaultMaterialDescriptions();
    for (var m = 0; m < MaterialDescriptions.length; m++) {
        if (MaterialDescriptions[m].constructor.name === shaderType) {
            return MaterialDescriptions[m];
        }
    }

    //Default PBR fallback
    return GetMaterialDescription("PBRMaterialShader");
}
