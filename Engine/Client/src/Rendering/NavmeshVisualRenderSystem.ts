import { Color3, Color4, Material, StandardMaterial } from "@babylonjs/core";
import { SetSimpleMaterialColor } from "@engine/Materials/AsyncSimpleImageMaterial";
import { GetSimpleImageMaterial } from "@engine/Materials/SimpleImageMaterial";
import { GetEcosystemForModule } from "@engine/RunnableGameEcosystem";
import { ExtractedMeshData, ExtractedMeshDataToMesh } from "@engine/Utils/MeshUtils";
import { GetWasmModule } from "@engine/WASM/ServerWASMModule";
import { decode } from "@msgpack/msgpack";

var navmeshVizSetup = false;
const NavVisMeshName = "___NAV_VIS_MESH___";
const NavVisMaterialName = "___NAV_VIS_MATERIAL___";

export function SetupNavmeshVisualiser() {
    if(navmeshVizSetup) {
        return;
    }
    //@ts-ignore
    window.OnNavmeshRebuild = async function (data: Uint8Array, module: string) {
        const unpackedData = decode(new Uint8Array(data));
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);
        if(!ecosystem.dynamicProperties[NavVisMaterialName]) {
            const newMat = GetSimpleImageMaterial(ecosystem.scene);
            ecosystem.dynamicProperties[NavVisMaterialName] = newMat;
            newMat.alpha = 0.02;
            newMat.cullBackFaces = false;
            SetSimpleMaterialColor(newMat, new Color4(0.9,0.8,0.3,0.02));
        }
        const extractData = unpackedData as ExtractedMeshData;
        const mesh = ExtractedMeshDataToMesh(extractData,ecosystem.scene);
        mesh.material = ecosystem.dynamicProperties[NavVisMaterialName];
        if(ecosystem.dynamicProperties[NavVisMeshName]) {
            ecosystem.dynamicProperties[NavVisMeshName].dispose();
        }
        ecosystem.dynamicProperties[NavVisMeshName] = mesh;
        console.log("Navmesh rebuilt. Number verts: " + extractData.vertices.length);
    };
}
