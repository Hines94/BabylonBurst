import { Scene, VertexBuffer } from "@babylonjs/core";
import { AsyncAssetManager, AsyncStaticMeshDefinition, StaticMeshCloneDetails } from "@engine/AsyncAssets";
import { encode } from "@msgpack/msgpack";

var setupScene:Scene;

export function SetupModelLoader(scene:Scene,manager: AsyncAssetManager) {
    setupScene = scene;
    //@ts-ignore
    window.RequestModelData = function (file:string,modelName:string,fileIndex:int,module: string) {
        const identifier:string = file + "_" + modelName + "_" + fileIndex;
        if(!requestedModels[identifier]) {
            requestedModels[identifier] = new AsyncStaticMeshDefinition(file,modelName,[null],fileIndex);
            requestedModels[identifier].loadInMesh(setupScene);
            return "";
        }
        const mesh = requestedModels[identifier].GetFinalMesh(setupScene);
        if(!mesh) {
            return "";
        }
        //Pass mesh data back in encoded format
        // Get vertex data
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        const indices = mesh.getIndices();

        if(!positions) {
            return "";
        }
        if(!indices) {
            return "";
        }

        // Prepare data structure for msgpack
        const dataToPack:any = {
            vertices: [],
            triangles: []
        };

        for(let i = 0; i < positions.length; i += 3) {
            dataToPack.vertices.push(
                positions[i],
                positions[i+1],
                positions[i+2]
            );
        }

        for(let i = 0; i < indices.length; i += 3) {
            dataToPack.triangles.push(
                indices[i],
                indices[i+1],
                indices[i+2]
            );
        }
        return encode(dataToPack);
    };
}

var requestedModels:{[id:string]:AsyncStaticMeshDefinition} = {};