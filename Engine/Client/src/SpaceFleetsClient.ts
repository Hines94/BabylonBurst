import { UpdateGameSpecificSystems as UpdateGameplaySpecificSystems, UpdateSystemsLoop } from "./SystemsLoop";
import { FramerateCounter } from "./GUI/Generic/FramerateCounter";
import { ServerConnection } from "./Networking/ServerConnection";
import { RunnableGameEcosystem } from "./RunnableGameEcosystem";
import { GameEcosystem } from "./GameEcosystem";
//import * as Ammo from 'ammo.js';

/** Game specific ecosystem client. Has main scene for rendering main game. */
export class SpaceFleetClient extends RunnableGameEcosystem {
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
        //TODO: Proper connection
        new ServerConnection();
    }

    override async setupScene() {
        await super.setupScene();
        this.counter = new FramerateCounter();
    }

    protected override updateWindowSpecificSystems(ecosystem: GameEcosystem) {
        UpdateGameplaySpecificSystems(ecosystem);
    }
}
