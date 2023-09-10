import { Material, PBRMaterial, Scene } from "@babylonjs/core";
import { MateralDescription } from "@engine/Materials/MaterialDescription";
import { AsyncTextureSetupParameter, MaterialSetupParameter } from "@engine/Materials/MaterialSetupParameter";

export class PBRMaterialShader extends MateralDescription {
    GetMaterialInstance(scene: Scene): Material {
        return new PBRMaterial("GeneratedPBRMaterial", scene);
    }
    GetPossibleMaterialParameters(): { [propName: string]: MaterialSetupParameter } {
        return {
            albedoTexture: new AsyncTextureSetupParameter(),
        };
    }
}
