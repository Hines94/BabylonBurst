import { Button } from "@babylonjs/gui";

/** Controls the state of buttons - eg only one is selected at once */
export class PanelStateButtons {
    buttons: Button[] = [];
    unclickedColor = "grey";
    clickedColor = "orange";

    AddButton(but: Button, callback: () => void) {
        this.buttons.push(but);
        const cont = this;
        but.onPointerClickObservable.add(() => {
            callback();
            cont.onButtonClicked(but);
        });
    }

    onButtonClicked(button: Button) {
        for (var i = 0; i < this.buttons.length; i++) {
            if (button === this.buttons[i]) {
                this.buttons[i].background = this.clickedColor;
            } else {
                this.buttons[i].background = this.unclickedColor;
            }
        }
    }
}
