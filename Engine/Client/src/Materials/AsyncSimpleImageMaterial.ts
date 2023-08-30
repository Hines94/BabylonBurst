import { Color3, Color4, InputBlock, Material, NodeMaterial, Scene, Vector4 } from "@babylonjs/core";

import { GetSimpleImageMaterial } from "./SimpleImageMaterial";
import { AsyncImageDescription, AsyncMaterial } from "../../../Shared/src/AsyncAssets";

/** A default implementation of our cell shaded material */
export class AsyncSimpleImageMaterial extends AsyncMaterial {
    image: AsyncImageDescription;
    color: Color4;
    useInstance: boolean;

    constructor(params: Partial<AsyncSimpleImageMaterial>) {
        super();
        Object.assign(this, params);
    }

    protected getSpecificMaterial(scene: Scene): NodeMaterial {
        return GetSimpleImageMaterial(scene);
    }

    //@ts-ignore
    protected CreateOurMaterial(scene: Scene): Material {
        const material = this.getSpecificMaterial(scene);
        this.populateTextures(material);
        this.populateColors(material);
        if (this.useInstance !== undefined) {
            //@ts-ignore
            material.getBlockByName("UseInstanceColor").value = this.useInstance;
        }
        return material;
    }

    async populateTextures(material: NodeMaterial) {
        if (this.image !== undefined) {
            const DiffTex = await this.image.GetImageAsTexture();
            //@ts-ignore
            material.getBlockByName("ImageTexture").texture = DiffTex;
            //@ts-ignore
            material.getBlockByName("UseTexture").value = 1;
        }
    }
    async populateColors(material: NodeMaterial) {
        if (this.color !== undefined) {
            SetSimpleMaterialColor(material, this.color);
        }
    }
}

export function SetSimpleMaterialColor(mat: Material, color: Color4) {
    const colorBlock = (mat as NodeMaterial).getBlockByName("ColorMultiplier") as InputBlock;
    if (colorBlock !== undefined && colorBlock !== null) {
        colorBlock.value = color;
    }
}
