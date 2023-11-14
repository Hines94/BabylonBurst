import { GameEcosystem } from "../GameEcosystem";
import { GameSystem } from "./GameSystem";

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

export function RunGameSystems(ecosystem:GameEcosystem) {
    for(var i = 0; i < registeredSystems.length;i++) {
        //@ts-ignore - Set private so users don't get confused
        registeredSystems[i].callGameSystemRun(ecosystem);
    }
}