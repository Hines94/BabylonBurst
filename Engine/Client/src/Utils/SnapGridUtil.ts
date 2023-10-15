import { Vector2, Vector3 } from "@babylonjs/core";
import { InstancedMeshTransform } from "@engine/AsyncAssets";


export const buildableGridSize = 0.5;

//Handy static class for getting positions around grids
export class SnapGridUtil {
    static GetGridPositions(NumX: number, NumY: number, VisibleBooleans: boolean[][], gridSize: number) {
        var ret: Vector3[] = [];

        const xOffset = gridSize * (NumX / 2) - gridSize / 2;
        const yOffset = gridSize * (NumY / 2) - gridSize / 2;

        for (var col = 0; col < NumX; col++) {
            for (var row = 0; row < NumY; row++) {
                if (VisibleBooleans !== undefined && VisibleBooleans[col][row] === false) {
                    continue;
                }

                var pos = new Vector3(col * gridSize - xOffset, row * gridSize - yOffset, 0);

                ret.push(pos);
            }
        }
        return ret;
    }

    static GetGridTransformInstances(NumX: number, NumY: number, VisibleBooleans: boolean[][], gridSize: number) {
        const positions = SnapGridUtil.GetGridPositions(NumX, NumY, VisibleBooleans, gridSize);
        var ret = [];
        for (var i = 0; i < positions.length; i++) {
            const tf = new InstancedMeshTransform();
            tf.location = positions[i];
            ret.push(tf);
        }
        return ret;
    }

    static GetBoundsOfGrid(NumX: number, NumY: number, gridSize: number) {
        const xOffset = (NumX * gridSize) / 2;
        const yOffset = (NumY * gridSize) / 2;
        return {
            minX: -xOffset,
            maxX: xOffset,
            minY: -yOffset,
            maxY: yOffset,
        };
    }

    static GetItemPosition(XIndex: number, YIndex: number, NumX: number, NumY: number, gridSize: number): Vector2 {
        const xOffset = gridSize * (NumX / 2) - gridSize / 2;
        const yOffset = gridSize * (NumY / 2) - gridSize / 2;

        return new Vector2(XIndex * gridSize - xOffset, YIndex * gridSize - yOffset);
    }
}
