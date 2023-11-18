import { Mesh, MeshBuilder, StandardMaterial } from "@babylonjs/core";
import { InstancedMeshTransform, SetTransformArray } from "@engine/AsyncAssets";

export class DebugBoxSpecification {
    transform: InstancedMeshTransform;
    duration: number;
    /** <0 duration means 1 frame */
    constructor(tf: InstancedMeshTransform, duration: number) {
        this.transform = tf;
        this.duration = duration;
    }
}

export class DebugBoxVisualiser {
    debugMesh: Mesh;
    debugItems: DebugBoxSpecification[] = [];

    CreateDebugItem(spec: DebugBoxSpecification) {
        this.debugItems.push(spec);
    }

    UpdateDebugItems(deltaTime: number) {
        if (this.debugMesh === undefined) {
            this.debugMesh = MeshBuilder.CreateBox("Debug Box");
            this.debugMesh.material = new StandardMaterial("DebugBoxMat", this.debugMesh.getScene());
        }
        this.debugMesh.isVisible = this.debugItems.length > 0;
        if (this.debugMesh.isVisible === false) {
            return;
        }
        const transforms = [];
        for (var i = 0; i < this.debugItems.length; i++) {
            transforms.push(this.debugItems[i].transform);
        }
        SetTransformArray(transforms, this.debugMesh);
        this.debugItems = this.debugItems.filter(element => {
            element.duration -= deltaTime;
            return element.duration > 0;
        });
    }
}

export const debugBoxVis = new DebugBoxVisualiser();
