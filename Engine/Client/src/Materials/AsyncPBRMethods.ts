import { PBRMaterial } from "@babylonjs/core";
import { AsyncImageDescription } from "rooasyncassets";

export async function SetAlbedoToPBR(mat: PBRMaterial, alb: AsyncImageDescription) {
    if (alb === undefined || alb.ourPath === undefined || alb.ourPath === "") {
        return;
    }
    const diff = await alb.GetImageAsTexture();
    mat.albedoTexture = diff;
    mat.albedoTexture.hasAlpha = true;
}

export async function SetMetallicToPBR(mat: PBRMaterial, met: AsyncImageDescription) {
    if (met === undefined || met.ourPath === undefined || met.ourPath === "") {
        return;
    }
    const diff = await met.GetImageAsTexture();
    mat.metallicTexture = diff;
}
