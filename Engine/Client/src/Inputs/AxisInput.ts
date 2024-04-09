import { GetBoundInputValue } from "@BabylonBurstClient/Inputs/InputKeyNameValues";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { Clamp } from "@BabylonBurstCore/Utils/MathUtils";
import { } from "@babylonjs/core"

export class AxisInput {
    positiveKeybinds: number[] = [];
    negativeKeybinds: number[] = [];

    axisValue = 0;
    priorAxisValue = 0;

    constructor(positiveKeybinds: number[], negativeKeybinds: number[]) {
        this.positiveKeybinds = positiveKeybinds;
        this.negativeKeybinds = negativeKeybinds;
    }

    UpdateValue(ecosystem: GameEcosystem) {
        const vals: number[] = [];
        var newValue = 0;
        //If we are typing then don't activate!
        if (!ecosystem.controlHasFocus) {
            for (var i = 0; i < this.positiveKeybinds.length; i++) {
                if (GetBoundInputValue(this.positiveKeybinds[i], ecosystem)) {
                    newValue += 1;
                }
            }
            for (var i = 0; i < this.negativeKeybinds.length; i++) {
                if (GetBoundInputValue(this.negativeKeybinds[i], ecosystem)) {
                    newValue -= 1;
                }
            }
        }

        this.setNewActivity(newValue);
    }

    setNewActivity(val: number) {
        this.priorAxisValue = this.axisValue;
        this.axisValue = Clamp(val, -1, 1);
    }
}