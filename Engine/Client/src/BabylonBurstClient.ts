import { FramerateCounter } from "./GUI/Generic/FramerateCounter";
import { RunnableGameEcosystem } from "./RunnableGameEcosystem";
import { GameEcosystem } from "@engine/GameEcosystem";

/** Game specific ecosystem client. Has main scene for rendering main game. */
export class BabylonBurstClient extends RunnableGameEcosystem {
    //Maximum bounds of the world
    worldRadius = 50;
    worldHeight = 20;
    tileSize = 1;

    counter: FramerateCounter;
    gameSetup = false;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }

    override async setupEngineRunLoop(canvas: HTMLCanvasElement): Promise<void> {
        await super.setupEngineRunLoop(canvas);
    }

    override async setupScene() {
        await super.setupScene();
        this.counter = new FramerateCounter();
    }

}
