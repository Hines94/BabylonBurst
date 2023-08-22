import { Color4, LinesMesh, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import { InstancedMeshTransform, SetTransformArray } from "rooasyncassets";
import { DisposeOfObject } from "../Utils/SceneUtils";
import { defaultLayerMask } from "../Utils/LayerMasks";

/** Uses a line renderer to render a feint grid to help with perspective */
export class GridEdgeOverlay {
    gridMesh: Mesh;

    constructor(size: number, gridSize: number) {
        this.gridMesh = MeshBuilder.CreateBox("GridVisib", { size: gridSize });
        this.gridMesh.material = new StandardMaterial("Grid");
        this.gridMesh.enableEdgesRendering();
        this.gridMesh.material.alpha = 0;
        this.gridMesh.edgesColor = new Color4(0.5, 0.5, 0.5, 0.01);
        this.gridMesh.layerMask = defaultLayerMask;
        const instances: InstancedMeshTransform[] = [];
        for (var r = 0; r < size * 2; r++) {
            const x = r * gridSize - size * gridSize;
            for (var c = 0; c < size * 2; c++) {
                const y = c * gridSize - size * gridSize;
                for (var d = 0; d < size * 2; d++) {
                    const z = d * gridSize - size * gridSize;
                    instances.push(
                        new InstancedMeshTransform(new Vector3(x, y, z), new Vector3(), new Vector3(1, 1, 1))
                    );
                }
            }
        }

        SetTransformArray(instances, this.gridMesh);
    }

    dispose() {
        DisposeOfObject(this);
    }
}
