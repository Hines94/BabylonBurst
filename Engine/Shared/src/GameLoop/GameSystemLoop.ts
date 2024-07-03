import { GameEcosystem } from "../GameEcosystem";
import { GameSystem } from "./GameSystem";

export enum SystemHookType {
    Render,
    Physics,
    PreRender
}

const registeredSystems:GameSystem[] = [];

/** Easily get the specific system to disable / overwrite logic etc */
export function GetSystemOfType<T extends GameSystem>(sysType: { new(): T }): T | undefined {
    for(var s = 0; s < registeredSystems.length;s++) {
        if(registeredSystems[s] instanceof sysType && registeredSystems[s].constructor === sysType) {
            return registeredSystems[s] as T;
        }
    }
    return undefined;
}

export function RegisterGameSystem(system:GameSystem) {
    if(system === undefined) {
        return;
    }
    if(registeredSystems.includes(system)) {
        console.error(`Tried to register same game system twice: ${system.constructor.name}`);
        return;
    }
    for(var i = 0; i < registeredSystems.length;i++) {
        if(registeredSystems[i].constructor === system.constructor) {
            console.error(`Tried to register the same system twice : ${system.constructor.name}`)
            return;
        }
    }
    registeredSystems.push(system);
    SortGameSystems();
}

export function SortGameSystems() {
    registeredSystems.sort((a, b) => { return a.SystemOrdering - b.SystemOrdering; });
}

export class GameSystemLooper {
    ourLoopType = SystemHookType.Render;
    private lastRunTime = 0;
    /** Delta time specific to this game loop (eg physics) */
    LoopDeltaTime = 0;

    constructor(loopType:SystemHookType) {
        this.ourLoopType = loopType;
    }

    RunGameSystems(ecosystem:GameEcosystem) {
        var NewTick = performance.now();
        this.LoopDeltaTime = (NewTick - this.lastRunTime)/1000;
        this.lastRunTime = NewTick;

        for(var i = 0; i < registeredSystems.length;i++) {
            if(registeredSystems[i].systemHookType !== this.ourLoopType) {
                continue;
            }
            //@ts-ignore - Set private so users don't get confused
            registeredSystems[i].callGameSystemRun(ecosystem, this.LoopDeltaTime);
        }
    }
}
/** Will run all systems before render loop */
export const preRenderLooper = new GameSystemLooper(SystemHookType.PreRender);
/** Will run all systems on render loop */
export const renderLooper = new GameSystemLooper(SystemHookType.Render);
/** Will run all of our physics systems */
export const prePhysicsLooper = new GameSystemLooper(SystemHookType.Physics);
