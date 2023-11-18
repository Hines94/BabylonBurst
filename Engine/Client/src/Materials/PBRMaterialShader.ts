import { MateralDescription } from "@BabylonBurstClient/Materials/MaterialDescription";
import {
    AsyncTextureSetupParameter,
    BooleanSetupParameter,
    ColorSetupParameter,
    MaterialSetupParameter,
    ScalarSetupParameter,
} from "@BabylonBurstClient/Materials/MaterialSetupParameter";
import { Material, PBRMaterial, Scene } from "@babylonjs/core";

export class PBRMaterialShader extends MateralDescription {
    GetMaterialInstance(scene: Scene): Material {
        return new PBRMaterial("GeneratedPBRMaterial", scene);
    }
    GetPossibleMaterialParameters(): { [propName: string]: MaterialSetupParameter } {
        return {
            albedoTexture: new AsyncTextureSetupParameter(),
            bumpTexture: new AsyncTextureSetupParameter(),
            emissiveIntensity: new ScalarSetupParameter(),
            emissiveTexture: new AsyncTextureSetupParameter(),
            emissiveColor: new ColorSetupParameter(),
            disableLighting: new BooleanSetupParameter(),
            roughness: new ScalarSetupParameter(),
        };
    }
}
