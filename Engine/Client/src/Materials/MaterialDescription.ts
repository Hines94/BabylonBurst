import { Material, Scene } from "@babylonjs/core";
import { SetupDefaultMaterialDescriptions } from "@engine/Materials/EngineMaterialDescriptions";
import { MaterialSetupParameter } from "@engine/Materials/MaterialSetupParameter";

type PossibleMaterialParams = {
    [propName: string]: MaterialSetupParameter;
};

/** Allows us to create a Material Instance in Editor that we can use for our models */
export abstract class MateralDescription {
    /** Create an instance of this material for use with a mesh */
    abstract GetMaterialInstance(scene: Scene): Material;

    /** Possible parameters that could be set into our material instances */
    abstract GetPossibleMaterialParameters(): PossibleMaterialParams;
}
