import { Color3, Color4, Material, StandardMaterial } from "@babylonjs/core";
import { GameEcosystem } from "@engine/GameEcosystem";
import { SetSimpleMaterialColor } from "@engine/Materials/AsyncSimpleImageMaterial";
import { GetSimpleImageMaterial } from "@engine/Materials/SimpleImageMaterial";
import { GetEcosystemForModule } from "@engine/RunnableGameEcosystem";
import { ExtractedMeshData, ExtractedMeshDataToMesh, ExtractedMeshDataToMeshUpNormals } from "@engine/Utils/MeshUtils";
import { GetWasmModule } from "@engine/WASM/ServerWASMModule";
import { decode } from "@msgpack/msgpack";

var navmeshVizSetup = false;
const NavVisMeshName = "___NAV_VIS_MESH___";
const NavVisMaterialName = "___NAV_VIS_MATERIAL___";

const HeightVisMeshName = "___HEIGHTFIELD_VIS_MESH___";
const HeightVisMaterialName = "___HEIGHTFIELD_VIS_MATERIAL___";

export function SetupNavmeshVisualiser() {
    if (navmeshVizSetup) {
        return;
    }
    //@ts-ignore
    window.OnNavmeshRebuild = async function (data: Uint8Array, module: string) {
        const unpackedData = decode(new Uint8Array(data));
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);

        EnsureMaterialPresent(ecosystem, NavVisMaterialName, new Color4(0.9, 0.8, 0.3, 0.02));
        RebuildVisMesh(unpackedData, ecosystem, ecosystem.dynamicProperties[NavVisMaterialName], NavVisMeshName);
    };

    //@ts-ignore
    window.OnHeightfieldRebuild = async function (data: Uint8Array, module: string) {
        const unpackedData = decode(new Uint8Array(data));
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);

        EnsureMaterialPresent(ecosystem, HeightVisMaterialName, new Color4(0, 0.9, 0, 0.02));
        RebuildVisMesh(unpackedData, ecosystem, ecosystem.dynamicProperties[HeightVisMaterialName], HeightVisMeshName);
    };
}
function RebuildVisMesh(unpackedData: unknown, ecosystem: GameEcosystem, mat: Material, name: string) {
    const extractData = unpackedData as ExtractedMeshData;
    const mesh = ExtractedMeshDataToMesh(extractData, ecosystem.scene);
    mesh.material = mat;
    if (ecosystem.dynamicProperties[name]) {
        ecosystem.dynamicProperties[name].dispose();
    }
    ecosystem.dynamicProperties[name] = mesh;

    console.log(name + "rebuilt. Number verts: " + extractData.vertices.length);

    return mesh;
}

function EnsureMaterialPresent(ecosystem: GameEcosystem, name: string, color: Color4) {
    if (!ecosystem.dynamicProperties[name]) {
        const newMat = GetSimpleImageMaterial(ecosystem.scene);
        ecosystem.dynamicProperties[name] = newMat;
        newMat.alpha = 0.02;
        newMat.cullBackFaces = false;
        SetSimpleMaterialColor(newMat, color);
    }
}
