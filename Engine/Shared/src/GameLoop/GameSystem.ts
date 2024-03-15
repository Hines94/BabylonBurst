import { GameEcosystem } from "../GameEcosystem";
import { RegisterGameSystem, SystemHookType } from "./GameSystemLoop";

export enum GameSystemRunType {
    GameOnly,
    EditorOnly,
    GameAndEditor
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
    /** Systems can be run at different times eg render or physics. NOTE: Ordering only relevant for same hook type */
    systemHookType = SystemHookType.Render;

    private runEcosystems:{[id:string]:boolean} = {};

    lastRun = 10;

    constructor() {
        RegisterGameSystem(this);
    }
    /** Called before the first 'RunSystem' is called */
    abstract SetupGameSystem(ecosystem:GameEcosystem);
    
    private callGameSystemRun(ecosystem:GameEcosystem, deltaTime:number) {
        if(this.bTrackSystemStats) {
            //TODO: Track stats
        }
        this.lastRun += deltaTime;
        if(this.RateLimit > 0) {
            if(this.lastRun < this.RateLimit) {
                return;
            }
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
        this.RunSystem(ecosystem, deltaTime);
        this.lastRun = 0;
    }

    /** Called as frequently as RateLimit (deltaTime not same as ecosystem deltatime if not render hook) */
    abstract RunSystem(ecosystem:GameEcosystem, deltaTime:number);
}