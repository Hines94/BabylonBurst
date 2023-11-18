import { DynamicTexture, Material, Scene, StandardMaterial } from "@babylonjs/core";

/** The metadata should be set for our scene with id as a priority! */
export function GetAsyncSceneIdentifier(scene: Scene) {
    //Going old school JS on this!
    //@ts-ignore
    if (scene["___ASYNCASSETUNIQUEID___"] === undefined) {
        //@ts-ignore
        scene["___ASYNCASSETUNIQUEID___"] = generateUUID();
    }
    //@ts-ignore
    return scene["___ASYNCASSETUNIQUEID___"];
}

function generateUUID() {
    // Public Domain/MIT
    var d = new Date().getTime(); //Timestamp
    var d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) {
            //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
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

    const mat = new StandardMaterial("BadMeshMat",scene);
    mat.emissiveTexture = dynamicTexture;
    badMeshMats[GetAsyncSceneIdentifier(scene)] = mat;

    return mat;
}
