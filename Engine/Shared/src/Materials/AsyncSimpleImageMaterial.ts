import { Color4, DynamicTexture, InputBlock, Material, NodeMaterial, Scene, Texture} from "@babylonjs/core";
import { GetSimpleImageMaterial } from "../../../Client/src/Materials/SimpleImageMaterial";
import { AsyncImageDescription } from "../AsyncAssets/AsyncImage";
import { AsyncMaterial } from "../AsyncAssets/AsyncMaterial";
import { GetAsyncSceneIdentifier } from "../AsyncAssets";

/** A default implementation of our unlit material */
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
            SetSimpleMaterialTexture(material, DiffTex);
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

export function SetSimpleMaterialTexture(material: Material, diffTex: Texture) {
    //@ts-ignore
    material.getBlockByName("ImageTexture").texture = diffTex;
    //@ts-ignore
    material.getBlockByName("UseTexture").value = 1;
}


var badMeshMats: { [sceneId: string]: Material } = {};
export function GetBadMeshMaterial(scene: Scene): Material {
    if (badMeshMats[GetAsyncSceneIdentifier(scene)]) {
        return badMeshMats[GetAsyncSceneIdentifier(scene)];
    }

    var textureResolution = 512;
    var dynamicTexture = new DynamicTexture("BadMatTexture", textureResolution, scene, true);
    var textureContext = dynamicTexture.getContext();

    var fontSize = 48;
    textureContext.font = fontSize + "px Arial";
    textureContext.fillStyle = "white";
    textureContext.fillRect(0, 0, textureResolution, textureResolution);
    textureContext.fillStyle = "red";
    var texts = ["BAD MESH", "ERROR", "CHECK LOG"];
    for (var i = 0; i < texts.length; i++) {
        var y = (textureResolution / (texts.length + 1)) * (i + 1);
        textureContext.fillText(texts[i], textureResolution / 2, y);
    }

    dynamicTexture.update();

    const mat = GetSimpleImageMaterial(scene);
    SetSimpleMaterialTexture(mat, dynamicTexture);
    badMeshMats[GetAsyncSceneIdentifier(scene)] = mat;

    return mat;
}
