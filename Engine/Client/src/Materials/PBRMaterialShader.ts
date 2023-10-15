import { MateralDescription } from "@BabylonBurstClient/Materials/MaterialDescription";
import { AsyncTextureSetupParameter, MaterialSetupParameter, ScalarSetupParameter } from "@BabylonBurstClient/Materials/MaterialSetupParameter";
import { Material, PBRMaterial, Scene } from "@babylonjs/core";

export class PBRMaterialShader extends MateralDescription {
    GetMaterialInstance(scene: Scene): Material {
        return new PBRMaterial("GeneratedPBRMaterial", scene);
    }
    GetPossibleMaterialParameters(): { [propName: string]: MaterialSetupParameter } {
        return {
            albedoTexture: new AsyncTextureSetupParameter(),
            roughness: new ScalarSetupParameter(),
        };
    }
}
