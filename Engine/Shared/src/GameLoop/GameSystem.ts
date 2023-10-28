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

    private lastRun = 10;

    constructor() {
        RegisterGameSystem(this);
    }
    
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
        this.RunSystem(ecosystem);
    }

    abstract RunSystem(ecosystem:GameEcosystem);
}