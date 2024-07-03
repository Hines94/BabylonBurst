import { GetBoundInputValue } from "@BabylonBurstClient/Inputs/InputKeyNameValues";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { Observable } from "@babylonjs/core"

/**
 * An input for a specific keybind. Contains useful methods for checking if we have used or not.
 * */
export class ButtonInput {
    wasActive = false;
    isActive = false;

    //TODO: Incorporate mouse binds?
    currentKeybinds: number[];

    constructor(defaultKeybinds: number[]) {
        this.currentKeybinds = defaultKeybinds;
    }

    UpdateValue(ecosystem: GameEcosystem) {
        const vals: number[] = [];
        //If we are typing then don't activate!
        if (ecosystem.controlHasFocus) {
            this.setNewActivity([0]);
        } else {
            for (var i = 0; i < this.currentKeybinds.length; i++) {
                vals.push(GetBoundInputValue(this.currentKeybinds[i], ecosystem));
            }
            this.setNewActivity(vals);
        }
    }

    /** ONLY Set in input module! */
    setNewActivity(values: number[]) {
        if (values.length === 0) {
            return;
        }
        //If we have an alternative key?
        var newval = values[0];
        for (var i = 0; i < values.length; i++) {
            if (values[i] === 1) {
                newval = 1;
                break;
            }
        }
        this.wasActive = this.isActive;
        this.isActive = newval === 1 ? true : false;
        if (this.wasJustActivated()) {
            this.onActivateKey.notifyObservers(this);
        } else if (this.wasJustDeactivated()) {
            this.onDeactivateKey.notifyObservers(this);
        }
    }

    /** Check if we have just pressed this button or not */
    wasJustActivated() {
        return this.wasActive === false && this.isActive === true;
    }

    /**Check if we have just released the key for this button */
    wasJustDeactivated() {
        return this.wasActive === true && this.isActive === false;
    }

    /** Will be called when we first press this key down */
    onActivateKey = new Observable<ButtonInput>();
    /** Will be called when we first release this key */
    onDeactivateKey = new Observable<ButtonInput>();
}
