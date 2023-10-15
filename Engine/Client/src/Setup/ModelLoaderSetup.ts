import { Scene, VertexBuffer } from "@babylonjs/core";
import { AsyncAssetManager, AsyncStaticMeshDefinition, StaticMeshCloneDetails } from "@engine/AsyncAssets";
import { decode, encode } from "@msgpack/msgpack";

var setupScene: Scene;

export function SetupModelLoader(scene: Scene, manager: AsyncAssetManager) {
    setupScene = scene;
    //@ts-ignore
    window.RequestModelData = function (file: string, modelName: string, fileIndex: int, module: string) {
        const identifier: string = file + "_" + modelName + "_" + fileIndex;
        if (!requestedModels[identifier]) {
            requestedModels[identifier] = new AsyncStaticMeshDefinition(file, modelName, [null], fileIndex);
            requestedModels[identifier].bNoFailMaterialDiff = true;
            requestedModels[identifier].loadInMesh(setupScene);
            return "";
        }
        const mesh = requestedModels[identifier].GetFinalMesh(setupScene);
        if (!mesh) {
            return "";
        }
        //Pass mesh data back in encoded format
        // Get vertex data
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        const indices = mesh.getIndices();

        if (!positions) {
            return "";
        }
        if (!indices) {
            return "";
        }

        // Prepare data structure for msgpack
        const dataToPack: any = {
            vertices: [],
            triangles: [],
        };

        for (let i = 0; i < positions.length; i += 3) {
            dataToPack.vertices.push(positions[i], positions[i + 1], positions[i + 2]);
        }

        for (let i = 0; i < indices.length; i += 3) {
            dataToPack.triangles.push(indices[i], indices[i + 1], indices[i + 2]);
        }
        const val = encode(dataToPack);
        //if(modelName == "RampedSurface") { testModelsEqual(val.join(" "));}
        return val;
    };
}
/** Easy way of manually testing if models are same on cpp as typescript */
function testModelsEqual(tsDataRaw: string) {
    const cppDataRaw = ``;
    const cppUint8Array = new Uint8Array(cppDataRaw.split(" ").map(byte => parseInt(byte, 10)));
    const cppData: any = decode(cppUint8Array);

    const tsUint8Array = new Uint8Array(tsDataRaw.split(" ").map(byte => parseInt(byte, 10)));
    const tsData: any = decode(tsUint8Array);

    console.log("--- Equality check for model --- ");

    for (var v = 0; v < tsData.vertices.length; v++) {
        if (tsData.vertices[v] !== cppData.vertices[v]) {
            console.log("vert Not equal: " + v + " C++: " + cppData.vertices[v] + " BABYLON: " + tsData.vertices[v]);
        }
        //console.log("CPP: " + cppData.vertices[v] + " TS: " + tsData.vertices[v])
    }
    for (var v = 0; v < tsData.triangles.length; v++) {
        if (tsData.triangles[v] !== cppData.triangles[v]) {
            console.log("tri Not equal: " + v + " C++: " + cppData.vertices[v] + " BABYLON: " + tsData.vertices[v]);
        }
        //console.log("CPP: " + cppData.triangles[v] + " TS: " + tsData.triangles[v])
    }

    console.log("Raw equal: " + cppDataRaw == tsDataRaw);
}

var requestedModels: { [id: string]: AsyncStaticMeshDefinition } = {};
