import { Button, TextBlock } from "@babylonjs/gui";
import { DisposeOfObject } from "../../Utils/SceneUtils";

/** One of the little icons at the bottom to show what item we currently have selected */
export class NavigatableGridItemIcon {
    tempText: string;
    tempTextBlock: TextBlock;
    loadedIndex: number;
    loadedButton: Button;
    loadedRowCol: { row: number; col: number };
    loadedRenderRowCol: { row: number; col: number };

    constructor(tempText: string = "") {
        this.tempText = tempText;
    }

    LoadIntoSlot(
        owner: Button,
        loadIndex: number,
        rowCol: { row: number; col: number },
        renderRowCol: { row: number; col: number },
    ) {
        this.loadedButton = owner;
        this.loadedIndex = loadIndex;
        this.loadedRowCol = rowCol;
        this.loadedRenderRowCol = renderRowCol;
        owner.isVisible = true;
        //TODO: use icons instead
        if (this.tempText !== undefined) {
            this.tempTextBlock = new TextBlock("temp_name", this.tempText);
            owner.addControl(this.tempTextBlock);
        }
    }

    RefreshSelected(currentIndex: number) {
        if (currentIndex === this.loadedIndex) {
            this.loadedButton.color = "#ffa600";
        } else {
            this.loadedButton.color = "white";
        }
    }

    dispose() {
        this.loadedButton = undefined;
        DisposeOfObject(this);
    }
}
