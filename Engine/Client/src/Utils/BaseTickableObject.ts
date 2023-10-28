import { GameEcosystem } from "@engine/GameEcosystem";
import { v4 as uuidv4 } from "uuid";

const allTickables: { [id: string]: BaseTickableObject } = {};

export function UpdateAllTickables(ecosystem: GameEcosystem) {
    const keys = Object.keys(allTickables);
    for (var i = 0; i < keys.length; i++) {
        if (allTickables[keys[i]]) {
            allTickables[keys[i]].performTick(ecosystem);
        }
    }
}

export abstract class BaseTickableObject {
    ourUUID: string;

    constructor() {
        this.ourUUID = uuidv4();
        this.SetTickEnabled(true);
    }

    SetTickEnabled(bTickEnabled: boolean) {
        if (bTickEnabled) {
            allTickables[this.ourUUID] = this;
        } else {
            delete allTickables[this.ourUUID];
        }
    }

    abstract performTick(ecosystem: GameEcosystem): void;

    dispose() {
        this.SetTickEnabled(false);
    }
}