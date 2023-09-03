import { ShowToastNotification } from "@engine/HTML/HTMLToastItem";
import { GetEcosystemForModule } from "@engine/RunnableGameEcosystem";
import { GetWasmModule } from "@engine/WASM/ServerWASMModule";

export function setupGeneralWASMCallbacks() {
    //@ts-ignore
    window.RequestVisualError = function (message: string, duration:number ,module: string) {
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);

        ShowToastNotification(message,duration,ecosystem.doc,"Red");
    }
    //@ts-ignore
    window.RequestVisualInfo = function (message: string, duration:number ,module: string) {
        const wasmmodule = GetWasmModule(module);
        const ecosystem = GetEcosystemForModule(wasmmodule);

        ShowToastNotification(message,duration,ecosystem.doc);
    }
}