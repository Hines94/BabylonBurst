import { Button, Grid } from "@babylonjs/gui";
import { NavigatableGridItemIcon } from "./NavigatableGridItemIcon";
import { Clamp } from "../../../../Shared/src/Utils/MathUtils";
import { GameEcosystem } from "@engine/GameEcosystem";

export class NavigatableGrid {
    itemGrid: Grid;
    itemHolders: Button[] = [];
    existingIcons: NavigatableGridItemIcon[];
    bInvertVerticalRendering = false;

    constructor(itemGrid: Grid) {
        this.itemGrid = itemGrid;
        const maxItems = this.itemGrid.rowCount * this.itemGrid.columnCount;
        //Copy from first
        //TODO: Setup new buttons instead of copy?
        if (this.itemGrid.children.length < maxItems) {
            for (var i = this.itemGrid.children.length; i < maxItems; i++) {
                const copy = this.itemGrid.children[0].clone();
                const row = Math.floor(i / this.itemGrid.columnCount);
                const col = i % this.itemGrid.columnCount;
                this.itemGrid.addControl(copy, row, col);
            }
        }
        this.itemGrid.children.forEach(ele => {
            this.itemHolders.push(ele as Button);
        });
    }

    private getIndexForItemHolder(row: number, col: number) {
        return row * this.itemGrid.columnCount + col;
    }

    private getRowColForItem(index: number): { row: number; col: number } {
        const row = Math.floor(index / this.lastBuildWidth);
        var col = index % this.lastBuildWidth;
        return {
            row: row,
            col: col,
        };
    }

    private getRenderRowColForItem(index: number): {
        row: number;
        col: number;
    } {
        const rowGrid = this.getRowColForItem(index);
        const renderRow = this.bInvertVerticalRendering ? this.itemGrid.rowCount - rowGrid.row - 1 : rowGrid.row;
        var renderCol = rowGrid.col;
        //TODO: Options for not centering?
        if (rowGrid.row === this.getNumRows() - 1) {
            var numShort = this.lastBuildWidth - (this.existingIcons.length - rowGrid.row * this.itemGrid.columnCount);
            renderCol += numShort / 2;
        }
        renderCol = Math.floor(renderCol);
        return {
            row: renderRow,
            col: renderCol,
        };
    }

    HideGridIcons() {
        for (var i = 0; i < this.itemHolders.length; i++) {
            this.itemHolders[i].isVisible = false;
        }
    }

    lastSelectIndex: number;
    lastRowWidth: number;
    lastBuildWidth: number;

    RefreshGridIcons(newIcons: NavigatableGridItemIcon[], selectedIndex: number) {
        this.ClearIcons();
        this.lastSelectIndex = selectedIndex;
        this.existingIcons = newIcons;

        const columnCount = this.itemGrid.columnCount;
        const rowCount = this.itemGrid.rowCount;
        this.lastBuildWidth = columnCount;
        const iconNumber = this.existingIcons.length;

        //tODO: Try to even out row width?

        //Hide all item holders
        this.HideGridIcons();

        //Load icons into slots
        for (var i = 0; i < iconNumber; i++) {
            const rowGrid = this.getRowColForItem(i);
            const rendRowCol = this.getRenderRowColForItem(i);
            this.existingIcons[i].LoadIntoSlot(
                this.itemHolders[this.getIndexForItemHolder(rendRowCol.row, rendRowCol.col)],
                i,
                rowGrid,
                rendRowCol
            );
        }
        this.lastRowWidth = iconNumber % this.lastBuildWidth;
        this.DrawSelected(selectedIndex);
    }

    DrawSelected(selectedIndex: number) {
        for (var i = 0; i < this.existingIcons.length; i++) {
            this.existingIcons[i].RefreshSelected(selectedIndex);
        }
        this.lastSelectIndex = selectedIndex;
    }

    //Given row/col get as close as we can
    private getClosestIndex(renderRow: number, renderCol: number): number {
        var closest = 1000000;
        var closestIndex: number;
        for (var i = 0; i < this.existingIcons.length; i++) {
            if (this.existingIcons[i].loadedRenderRowCol.row !== renderRow) {
                continue;
            }
            const icol = this.existingIcons[i].loadedRenderRowCol.col;
            if (Math.abs(icol - renderCol) < closest) {
                closest = Math.abs(icol - renderCol);
                closestIndex = this.existingIcons[i].loadedIndex;
            }
        }
        return closestIndex;
    }

    private getNumRows() {
        return Math.ceil(this.existingIcons.length / this.lastBuildWidth);
    }

    /** Returns requested move */
    UpdateMovementRequests(
        bAutoMove: boolean,
        bAutoWrapCol: boolean,
        bAutoWrapVert: boolean,
        ecosystem: GameEcosystem
    ): { horiz: number; vert: number } {
        const ret = { horiz: 0, vert: 0 };
        //Up one
        if (ecosystem.InputValues.ARROWUPKey.wasJustActivated()) {
            ret.vert = 1;
            this.MoveUpOne(bAutoWrapVert);
        }
        //Down one
        if (ecosystem.InputValues.ARROWDOWNKey.wasJustActivated() && ret.vert === 0) {
            ret.vert = -1;
            if (this.getNumRows() > 1) {
                const prior = this.getRowColForItem(this.lastSelectIndex);
                const priorRender = this.getRenderRowColForItem(this.lastSelectIndex);
                if (prior.row === 0) {
                    this.DrawSelected(
                        this.getClosestIndex(this.bInvertVerticalRendering ? 0 : this.getNumRows() - 1, priorRender.col)
                    );
                } else {
                    const nextRow = Clamp(
                        this.bInvertVerticalRendering ? priorRender.row + 1 : priorRender.row - 1,
                        0,
                        this.getNumRows()
                    );
                    const closest = this.getClosestIndex(nextRow, priorRender.col);
                    this.DrawSelected(closest);
                }
            }
        }
        //Left one
        if (ecosystem.InputValues.ARROWLEFTKey.wasJustActivated()) {
            ret.horiz -= 1;
            if (bAutoMove) {
                this.MoveLeftOne(bAutoWrapCol);
            }
        }
        //Right one
        if (ecosystem.InputValues.ARROWRIGHTKey.wasJustActivated() && ret.horiz === 0) {
            ret.horiz += 1;
            if (bAutoMove) {
                this.MoveRightOne(bAutoWrapCol);
            }
        }
        return ret;
    }

    private MoveUpOne(bAutoWrapVert: boolean) {
        if (this.getNumRows() > 1) {
            const prior = this.getRowColForItem(this.lastSelectIndex);
            if (prior.row === this.getNumRows() - 1) {
                if (!bAutoWrapVert) {
                    return;
                }
                this.DrawSelected(this.getRenderRowColForItem(this.lastSelectIndex).col);
            } else {
                const priorRender = this.getRenderRowColForItem(this.lastSelectIndex);
                const nextRow = Clamp(
                    this.bInvertVerticalRendering ? priorRender.row - 1 : priorRender.row + 1,
                    0,
                    this.getNumRows()
                );
                const closest = this.getClosestIndex(nextRow, priorRender.col);
                this.DrawSelected(closest);
            }
        }
    }

    private MoveRightOne(bAutoWrapCol: boolean) {
        const prior = this.getRowColForItem(this.lastSelectIndex);
        var newV: number;
        //Last row?
        if (prior.row === this.getNumRows() - 1) {
            if (prior.col === this.lastRowWidth - 1) {
                if (!bAutoWrapCol) {
                    return;
                }
                newV = this.lastSelectIndex - this.lastRowWidth + 1;
            } else {
                newV = this.lastSelectIndex + 1;
            }
            //Else just regular row - set back to start
        } else {
            if (prior.col === this.itemGrid.columnCount - 1) {
                if (!bAutoWrapCol) {
                    return;
                }
                newV = this.lastSelectIndex - this.itemGrid.columnCount + 1;
            } else {
                newV = this.lastSelectIndex + 1;
            }
        }
        this.DrawSelected(newV);
    }

    private MoveLeftOne(bAutoWrapCol: boolean) {
        const prior = this.getRowColForItem(this.lastSelectIndex);
        var newV: number;
        if (prior.col === 0) {
            if (!bAutoWrapCol) {
                return;
            }
            if (prior.row === this.getNumRows() - 1) {
                newV = this.existingIcons.length - 1;
            } else {
                newV = this.itemGrid.columnCount + this.lastSelectIndex - 1;
            }
        } else {
            newV = this.lastSelectIndex - 1;
        }
        this.DrawSelected(newV);
    }

    WasMoveRequested(ret: { horiz: number; vert: number }) {
        return ret.horiz !== 0 || ret.vert !== 0;
    }

    private ClearIcons() {
        if (this.existingIcons === undefined) {
            return;
        }
        for (var i = 0; i < this.existingIcons.length; i++) {
            this.existingIcons[i].dispose();
        }
        this.existingIcons = undefined;
    }
}
