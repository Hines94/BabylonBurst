import {
    MeshBuilder,
    Mesh,
    StandardMaterial,
    Scene,
    Color3,
    Matrix,
    Vector3,
    TransformNode,
    Color4,
} from "@babylonjs/core";
import { GetSimpleImageMaterial } from "../Materials/SimpleImageMaterial";
import { SetSimpleMaterialColor } from "../Materials/AsyncSimpleImageMaterial";
import { DisposeOfObject } from "../Utils/SceneUtils";
import { defaultLayerMask } from "../Utils/LayerMasks";
import { SnapGridUtil } from "../Utils/SnapGridUtil";
import { InstancedMeshTransform, SetTransformArray } from "../AsyncAssets";

export enum GridType {
    squareGrid,
    rangeFromOrigin,
}

function snapToTile(val: Vector3, tileSize: number) {
    return new Vector3(Math.round(val.x / tileSize) * tileSize, 0, Math.round(val.z / tileSize) * tileSize);
}

//A generic class for creating a grid overlay
export class GridFloorOverlay {
    //Determines type and shape
    gridType = GridType.squareGrid;
    requireNavmesh = false;

    tileMargin = 0.01;

    gridColor = new Color4(1, 1, 1, 0.2);

    //Determines square grid (and range) max distance
    gridWidthX = 100;
    gridWidthY = 100;
    gridTileSize = 1;
    layer: number = defaultLayerMask;

    //Range from origin params
    maxRange = -1;
    origin = new Vector3();

    moveableNode: TransformNode;
    floorTile: Mesh;

    constructor(scene: Scene, options: Partial<GridFloorOverlay> = {}) {
        Object.assign(this, options);
        this.floorTile = MeshBuilder.CreateBox(
            "floorTile",
            { size: this.gridTileSize * (1 - this.tileMargin), depth: 0.001 },
            scene
        );
        this.floorTile.layerMask = this.layer;

        this.floorTile.material = GetSimpleImageMaterial(scene).clone("GridFloorMat");
        SetSimpleMaterialColor(this.floorTile.material, this.gridColor);

        this.regularBuild();
        this.moveableNode = new TransformNode("GridMoveable");
        this.floorTile.parent = this.moveableNode;
    }

    setVisible(vis: boolean) {
        this.floorTile.isVisible = vis;
    }

    currentBooleans: boolean[][];
    BuildFromBooleans(shouldPlace: boolean[][]) {
        this.currentBooleans = shouldPlace;
        this.regularBuild(false);
    }

    regularBuild(bClearCurrent = true) {
        if (bClearCurrent) {
            this.currentBooleans = undefined;
        }
        var transforms = SnapGridUtil.GetGridTransformInstances(
            this.gridWidthX,
            this.gridWidthY,
            this.currentBooleans,
            this.gridTileSize
        );
        this.BuildFromTransforms(transforms);
    }

    BuildFromTransforms(transforms: InstancedMeshTransform[]) {
        SetTransformArray(transforms, this.floorTile);
        this.floorTile.isVisible = transforms.length > 0;
    }

    dispose() {
        DisposeOfObject(this);
    }
}
