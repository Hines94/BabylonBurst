import { AxesViewer, TransformNode } from "@babylonjs/core";
import { DisposeOfObject } from "./SceneUtils";

export class SFAxisViewer {
    root = new TransformNode("Axis");
    axis: AxesViewer;
    size: number;

    visible = { x: true, y: true, z: true };

    constructor(size: number) {
        this.size = size;
        this.rebuildAxis();
    }

    SetVisible(visibleX: boolean, visibleY: boolean, visibleZ: boolean) {
        if (
            (this.visible.x === false && visibleX === true) ||
            (this.visible.y === false && visibleY === true) ||
            (this.visible.z === false && visibleZ === true)
        ) {
            this.rebuildAxis();
        }

        if (visibleX === false && this.axis.xAxis !== undefined) {
            this.axis.xAxis.dispose();
        }
        if (visibleY === false && this.axis.yAxis !== undefined) {
            this.axis.yAxis.dispose();
        }
        if (visibleZ === false && this.axis.zAxis !== undefined) {
            this.axis.zAxis.dispose();
        }

        this.visible.x = visibleX;
        this.visible.y = visibleY;
        this.visible.z = visibleZ;
    }

    private rebuildAxis() {
        this.DisposeOfAxis();
        this.axis = new AxesViewer(this.root.getScene(), this.size);
        this.axis.xAxis.parent = this.root;
        this.axis.yAxis.parent = this.root;
        this.axis.zAxis.parent = this.root;
    }

    DisposeOfAxis() {
        if (this.axis !== undefined) {
            if (this.axis.xAxis !== undefined) {
                this.axis.xAxis.dispose();
            }
            if (this.axis.yAxis !== undefined) {
                this.axis.yAxis.dispose();
            }
            if (this.axis.zAxis !== undefined) {
                this.axis.zAxis.dispose();
            }
        }
        this.axis = undefined;
    }

    dispose() {
        DisposeOfObject(this);
    }
}
