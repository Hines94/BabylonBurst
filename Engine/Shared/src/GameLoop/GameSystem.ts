import { GameEcosystem } from "../GameEcosystem";
import { RegisterGameSystem } from "./GameSystemLoop";


export abstract class GameSystem {
    /** Lower called first and higher called later  */
    abstract SystemOrdering:number;
    /** Track the CPU time of this system? */
    bTrackSystemStats = true;
    /** Set to false if you don't want a system to run */
    bSystemEnabled = true;
    /** Set rate limit > 0 to limit a system from running too often */
    RateLimit = -1;

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