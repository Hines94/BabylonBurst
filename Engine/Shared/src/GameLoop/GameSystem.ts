import { GameEcosystem } from "../GameEcosystem";
import { RegisterGameSystem } from "./GameSystemLoop";

export enum GameSystemRunType {
    GameOnly,
    EditorOnly,
    GameAndEditor
}

export enum NetworkedSystemRunType {
    /** A special case for sytems specifically targeted at singleplayer and not multiplayer */
    SinglePlayerOnly,
    ClientOnly,
    ServerOnly,
    ClientServer,
}


export abstract class GameSystem {
    /** Lower called first and higher called later  */
    abstract SystemOrdering:number;
    /** Track the CPU time of this system? */
    bTrackSystemStats = true;
    /** Set to false if you don't want a system to run */
    bSystemEnabled = true;
    /** Set rate limit > 0 to limit a system from running too often */
    RateLimit = -1;
    /** Should this system run in editor or game? */
    systemRunType = GameSystemRunType.GameOnly;
    /** Set this to only run in specific circumstances */
    systemNetworkType = NetworkedSystemRunType.ClientServer;

    private runEcosystems:{[id:string]:boolean} = {};

    private lastRun = 10;

    constructor() {
        RegisterGameSystem(this);
    }
    /** Called before the first 'RunSystem' is called */
    abstract SetupGameSystem(ecosystem:GameEcosystem);
    
    private callGameSystemRun(ecosystem:GameEcosystem) {
        if(this.bTrackSystemStats) {
            //TODO: Track stats
        }
        if(this.RateLimit > 0) {
            this.lastRun += ecosystem.deltaTime;
            if(this.lastRun < this.RateLimit) {
                return;
            }
            this.lastRun = 0;
        }

        if(!this.bSystemEnabled) {
            return;
        }

        if(!ecosystem.isEditor && this.systemRunType === GameSystemRunType.EditorOnly) {
            return;
        }
        if(!ecosystem.isGame && this.systemRunType === GameSystemRunType.GameOnly) {
            return;
        }

        //First time running the system for this ecosystem?
        if(this.runEcosystems[ecosystem.uuid] === undefined) {
            this.SetupGameSystem(ecosystem);
            this.runEcosystems[ecosystem.uuid] = true;
        }
        this.RunSystem(ecosystem);
    }

    /** Called as frequently as RateLimit (or every frame) */
    abstract RunSystem(ecosystem:GameEcosystem);
}