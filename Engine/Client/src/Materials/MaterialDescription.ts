import { MaterialSetupParameter } from "@BabylonBurstClient/Materials/MaterialSetupParameter";
import { Material, Scene } from "@babylonjs/core";

type PossibleMaterialParams = {
    [propName: string]: MaterialSetupParameter;
};

/** Allows us to create a Material Instance in Editor that we can use for our models */
export abstract class MateralDescription {
    /** Create an instance of this material for use with a mesh */
    protected abstract GetMaterialInstance(scene: Scene): Material;

    /** Load an instance given our data */
    LoadMaterial(data: any, scene: Scene): Material {
        const mat = this.GetMaterialInstance(scene);
        const possibles = this.GetPossibleMaterialParameters();
        const names = Object.keys(possibles);
        for (var n = 0; n < names.length; n++) {
            const name = names[n];
            const param = possibles[names[n]];
            param.SetParameterIntoMaterial(mat, name, data);
        }
        return mat;
    }

    /** Possible parameters that could be set into our material instances */
    abstract GetPossibleMaterialParameters(): PossibleMaterialParams;
}
