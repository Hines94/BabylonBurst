import { Color4, Material, MeshBuilder, Observable, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "@engine/GameEcosystem";
import { ShowToastNotification } from "@engine/HTML/HTMLToastItem";
import { SetSimpleMaterialColor } from "@engine/Materials/AsyncSimpleImageMaterial";
import { GetSimpleImageMaterial } from "@engine/Materials/SimpleImageMaterial";
import { GetEcosystemForModule } from "@engine/RunnableGameEcosystem";
import { ExtractedMeshData, ExtractedMeshDataToMesh, GetRandomColor4 } from "@engine/Utils/MeshUtils";
import { GetWasmModule } from "@engine/WASM/ServerWASMModule";
import { decode } from "@msgpack/msgpack";

var navmeshVizSetup = false;

export type navStageChangeDat = {
    ecosystem: GameEcosystem;
    stage: string;
};

export const onNavmeshStageChange = new Observable<navStageChangeDat>();
export const onContoursRebuild = new Observable<GameEcosystem>();

export function RefreshNavmeshVisualisationStage(ecosystem: GameEcosystem, stage: string) {
    if (stage == "NavRegions") {
        for (var r = 0; r < 200; r++) {
            const meshStage = stage + "_" + r;
            RefreshMeshVisual(ecosystem, stage, getMeshNameForStage(meshStage));
        }
    } else {
        RefreshMeshVisual(ecosystem, stage, getMeshNameForStage(stage));
    }
}

function getMaterialNameForStage(stage: string) {
    return "___NAVVISMATERIAL___" + stage + "___";
}
function getMeshNameForStage(stage: string) {
    return "___NAVVISMESH___" + stage + "___";
}

function getMaterialColorForStage(stage: string): Color4 {
    if (stage == "Nav Geom In") {
        return new Color4(0.1, 0.1, 0.8, 0.02);
    }
    if (stage == "Nav Heightfield") {
        return new Color4(0.1, 0.9, 0.1, 0.02);
    }
    if (stage == "LowPoly NavMesh") {
        return new Color4(0.7, 0.9, 0.1, 0.02);
    }
    return new Color4(0.9, 0.8, 0.3, 0.02);
}

export function SetupNavmeshVisualiser() {
    if (navmeshVizSetup) {
        return;
    }
    //@ts-ignore
    window.OnNavStageBuild = async function (data: Uint8Array, stage: string, module: string) {
        const unpackedData = decode(new Uint8Array(data));
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);
        onNavmeshStageChange.notifyObservers({ ecosystem: ecosystem, stage: stage });

        //console.log(unpackedData)

        var mat = getMaterialNameForStage(stage);
        var mesh = getMeshNameForStage(stage);

        EnsureMaterialPresent(ecosystem, mat, getMaterialColorForStage(stage));
        RebuildVisMesh(unpackedData, ecosystem, ecosystem.dynamicProperties[mat], mesh);
        RefreshMeshVisual(ecosystem, stage, mesh);
    };

    //@ts-ignore
    window.OnNavRegionsBuild = async function (data: Uint8Array, module: string) {
        const stage = "NavRegions";
        const unpackedData = decode(new Uint8Array(data)) as any;
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);
        onNavmeshStageChange.notifyObservers({ ecosystem: ecosystem, stage: stage });

        for (var r = 0; r < 200; r++) {
            const meshStage = stage + "_" + r;
            var mesh = getMeshNameForStage(meshStage);
            if (ecosystem.dynamicProperties[mesh]) {
                ecosystem.dynamicProperties[mesh].dispose();
                delete ecosystem.dynamicProperties[mesh];
            }
        }

        for (var r = 0; r < unpackedData.length; r++) {
            if (r > 200) {
                ShowToastNotification(
                    "Too many navmesh regions to view! " + unpackedData.length,
                    6000,
                    ecosystem.doc,
                    "Red"
                );
                break;
            }
            const meshStage = stage + "_" + r;
            var mat = getMaterialNameForStage(meshStage);
            var mesh = getMeshNameForStage(meshStage);

            EnsureMaterialPresent(ecosystem, mat, GetRandomColor4(0.02));
            RebuildVisMesh(unpackedData[r], ecosystem, ecosystem.dynamicProperties[mat], mesh);
            RefreshMeshVisual(ecosystem, stage, mesh);
        }
    };

    //@ts-ignore
    window.OnNavCountorsBuild = async function (rawdata: Uint8Array, module: string) {
        const data = decode(new Uint8Array(rawdata)) as any;
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);
        const mat = getMaterialNameForStage("Contours");
        const mesh = getMeshNameForStage("Contours");

        EnsureMaterialPresent(ecosystem, mat, new Color4(1, 1, 1, 0.05));

        if (ecosystem.dynamicProperties[mesh]) {
            ecosystem.dynamicProperties[mesh].dispose();
        }
        let lines = [];
        for (let i = 0; i < data.segments.length; i += 6) {
            lines.push(new Vector3(data.segments[i], data.segments[i + 1], data.segments[i + 2]));
            lines.push(new Vector3(data.segments[i + 3], data.segments[i + 4], data.segments[i + 5]));
        }
        ecosystem.dynamicProperties[mesh] = MeshBuilder.CreateLines("lines", { points: lines }, ecosystem.scene);

        RefreshMeshVisual(ecosystem, "Contours", mesh);
    };
}

function RefreshMeshVisual(ecosystem: GameEcosystem, name: string, meshName: string) {
    if (!ecosystem.dynamicProperties[meshName]) {
        return;
    }

    const boolIndicator = "___" + name + "___";
    if (ecosystem.dynamicProperties[boolIndicator]) {
        ecosystem.dynamicProperties[meshName].isVisible = true;
    } else {
        ecosystem.dynamicProperties[meshName].isVisible = false;
    }
}

function RebuildVisMesh(unpackedData: unknown, ecosystem: GameEcosystem, mat: Material, name: string) {
    const extractData = unpackedData as ExtractedMeshData;
    const mesh = ExtractedMeshDataToMesh(extractData, ecosystem.scene);
    mesh.material = mat;
    if (ecosystem.dynamicProperties[name]) {
        ecosystem.dynamicProperties[name].dispose();
    }
    ecosystem.dynamicProperties[name] = mesh;

    //console.log(name + "rebuilt. Number verts: " + extractData.vertices.length);

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
