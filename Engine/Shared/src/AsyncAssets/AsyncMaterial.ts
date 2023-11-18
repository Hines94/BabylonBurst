import { Material, Scene } from "@babylonjs/core";

/** Material that asynch adds textures as they load from AWS */
export abstract class AsyncMaterial {
    private ourMaterial: Material = null;
    GetMaterial(scene: Scene) {
        if (this.ourMaterial === null) {
            this.ourMaterial = this.CreateOurMaterial(scene);
        }
        return this.ourMaterial;
    }

    /** Create our general material. Useful for using different shaders down the line.
     * Populate textures at this point. */
    protected abstract CreateOurMaterial(scene: Scene): Material;
}

/**
 *  General function for extracting either a regular material or the material from an Async material
 */
export function ExtractMaterialFromAny(possible: any, scene: Scene): Material {
    if (possible === null) {
        return null;
    }
    if (possible instanceof Material) {
        if(possible.getScene() !== scene) {
            console.warn("Material was specified for a different scene!");
            return null;
        }
        return possible;
    }
    if (possible instanceof AsyncMaterial) {
        return possible.GetMaterial(scene);
    }
    console.error("Passed invalid item as material: " + possible);
    return null;
}
