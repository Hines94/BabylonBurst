import {
    EntitySpecification,
    LoadEntitiesFromMsgpackFormat,
    RawEntityData,
    SaveEntitiesToMsgpackIntArray,
} from "../EntitySystem/EntityMsgpackConverter";
import { v4 as uuidv4 } from "uuid";
import { DisposeOfObject } from "../Utils/SceneUtils";
import { EntVector3 } from "@engine/EntitySystem/CoreComponents";

//@ts-ignore
window.WASMModules = {};

export function GetWasmModule(moduleId: string): ServerWASMModuleWrapper {
    //@ts-ignore
    return window.WASMModules[moduleId];
}

export function GetAllWasmModules(): ServerWASMModuleWrapper[] {
    const ret: ServerWASMModuleWrapper[] = [];
    //@ts-ignore
    const allModulesObject = window.WASMModules;
    const allModules = Object.keys(allModulesObject);
    allModules.forEach(m => {
        if (allModulesObject[m]) {
            ret.push(allModulesObject[m]);
        }
    });
    return ret;
}

//@ts-ignore
window.WASMSetupComplete = (module: string) => {
    //@ts-ignore
    const wasmModule: ServerWASMModuleWrapper = window["WASMModules"][module];
    if (!wasmModule) {
        console.error("WASM Module " + module + " not found! ");
        return;
    }
    console.log("Setup resolve ready!");
    wasmModule.setup = true;
    wasmModule.setupResolve();
};

/** Uint8Array from WASM. Convert with WASMArrayToUint8 */
interface WASMUint8Array {
    get(item: number): number;
    size(): number;
    push_back(val: number): void;
    delete(): void;
}

/** String array for WASM. std::vector<std::string> */
interface WASMStringArray {
    get(item: number): string;
    size(): number;
    set(position: number, item: string): void;
    push_back(item: string): void;
    delete(): void;
}

/** JS won't go up to uint64_t so max size uint32_t  */
type JSEntity = number;

interface WASMJSEntityArray {
    get(item: number): number;
    size(): number;
    push_back(val: number): void;
    delete(): void;
}

/** Hand-made typings and utils for WASM module functions */
export class ServerWASMModuleWrapper {
    wasmModule: any;
    uuid: string;
    setup: boolean;
    ___ECOSYSTEM___: any;
    setupResolve: (() => void) | null = null;

    constructor(wasmModule: any) {
        this.wasmModule = wasmModule;
        this.uuid = uuidv4();
        //@ts-ignore
        window["WASMModules"][this.uuid] = this;
        this.wasmModule.SetupWASMModule(this.uuid);
    }

    async awaitWASMModuleReady(): Promise<void> {
        if (this.setup) {
            return;
        }
        return new Promise<void>(resolve => {
            this.setupResolve = resolve; // The resolve function is assigned to the callFunction variable
        });
    }

    CreateEntVector3(item: EntVector3): any {
        return new this.wasmModule.EntVector3(item.X, item.Y, item.Z);
    }

    ConvertEntVector3(val: any): EntVector3 {
        const ret = new EntVector3(val.X, val.Y, val.Z);
        val.delete();
        return ret;
    }

    /** Update game loop including physics system/CSP etc */
    UpdateSingleGameLoop(): void {
        this.wasmModule.UpdateSingleGameLoop();
    }

    //------ Entity Module -----

    /** Check entity exists in WASM module or not  */
    DoesEntityExist(entId: JSEntity): boolean {
        return this.wasmModule.DoesEntityExist(entId);
    }

    /** Add a blank entity */
    AddEntity(): JSEntity {
        return this.wasmModule.AddEntity();
    }

    /** Actual remove will be performed on the next update */
    DelayedRemoveEntity(entId: JSEntity): boolean {
        return this.wasmModule.DelayedRemoveEntity(entId);
    }

    /** Actual remove will be performed on the next update */
    DelayedRemoveComponent(entId: JSEntity, componentName: string): boolean {
        return this.wasmModule.DelayedRemoveComponent(entId, componentName);
    }

    /** Get Msgpack data for All entities in system. Could be slightly wrong if not FlushEntitySystem called */
    GetAllEntities(ignoreDefaultValues = false): RawEntityData {
        return LoadEntitiesFromMsgpackFormat(WASMArrayToUint8(this.wasmModule.GetAllEntities(ignoreDefaultValues)));
    }

    GetAllEntitiesArray(ignoreDefaultValues = false): ArrayBuffer {
        return Uint8Array.from(WASMArrayToUint8(this.wasmModule.GetAllEntities(ignoreDefaultValues))).buffer;
    }

    /** Useful for comparison for changed values (eg for inspector in Editor) */
    GetDefaultComponentsForEntity(entId: JSEntity): RawEntityData {
        return LoadEntitiesFromMsgpackFormat(WASMArrayToUint8(this.wasmModule.GetDefaultComponentsForEntity(entId)));
    }

    /** ECS style filter for only relevant entities */
    GetEntitiesWithData(includes: Function[], excludes: Function[], ignoreDefaultValues = false): RawEntityData {
        var includesWASM: WASMStringArray = new this.wasmModule.VectorString();
        includes.forEach(val => {
            includesWASM.push_back(val.name);
        });
        var excludesWASM: WASMStringArray = new this.wasmModule.VectorString();
        excludes.forEach(val => {
            excludesWASM.push_back(val.name);
        });

        const result = LoadEntitiesFromMsgpackFormat(
            WASMArrayToUint8(this.wasmModule.GetEntitiesWithData(includesWASM, excludesWASM, ignoreDefaultValues))
        );
        includesWASM.delete();
        excludesWASM.delete();
        return result;
    }

    /** Remove all entities currently in existence */
    RemoveAllEntities() {
        const allEntities = this.GetAllEntities(true);
        const entIds = Object.keys(allEntities);
        entIds.forEach(element => {
            this.DelayedRemoveEntity(parseInt(element));
        });
        this.FlushEntitySystem();
    }

    /** Complete reset - remove all entites and refresh count */
    ResetEntitySystem() {
        this.wasmModule.ResetEntitySystem();
    }

    /** Get Msgpack data for specific Entity. Could be slightly wrong if not FlushEntitySystem called */
    GetDataForEntity(entId: JSEntity, ignoreDefaultValues = false): EntitySpecification {
        const allData = LoadEntitiesFromMsgpackFormat(
            WASMArrayToUint8(this.wasmModule.GetDataForEntity(entId, ignoreDefaultValues))
        );
        return allData[entId];
    }

    /** Will create new Entities but maintain the given relationships between EntityData*. Use SaveEntitiesToMsgpackIntArray to generate the data */
    LoadMsgpackDataToNewEntities(data: RawEntityData): JSEntity[] {
        let msgpackData: WASMUint8Array = new this.wasmModule.VectorUint8();
        const entData = SaveEntitiesToMsgpackIntArray(data);
        entData.forEach(d => {
            msgpackData.push_back(d);
        });
        const wasmLoaded = WASMArrayToJSEntity(this.wasmModule.LoadMsgpackDataToNewEntities(msgpackData));
        msgpackData.delete();
        return wasmLoaded;
    }

    /** For given existing entities (or created if not exist) create new entities in WASM.*/
    LoadMsgpackDataToExistingEntities(data: RawEntityData, bOverwrite: boolean) {
        this.wasmModule.FlushEntitySystem();
        let msgpackData: WASMUint8Array = new this.wasmModule.VectorUint8();
        const entData = SaveEntitiesToMsgpackIntArray(data);
        entData.forEach(d => {
            msgpackData.push_back(d);
        });
        this.wasmModule.LoadMsgpackDataToExistingEntities(msgpackData, bOverwrite);
        this.wasmModule.FlushEntitySystem();
        msgpackData.delete();
    }

    /** Performs Remove Components/Ents & cleanup buckets */
    FlushEntitySystem(): void {
        this.wasmModule.FlushEntitySystem();
    }

    /** Callback from WASM->AssetManager->WASM */
    AwsGetAllDataCallback(data: string[]) {
        var dataWASM: WASMStringArray = new this.wasmModule.VectorString();
        data.forEach(val => {
            dataWASM.push_back(val);
        });
        this.wasmModule.AwsGetAllDataCallback(dataWASM);
        dataWASM.delete();
    }

    AwsFilenamesCallback(itemName: string, data: string[]) {
        var dataWASM: WASMStringArray = new this.wasmModule.VectorString();
        data.forEach(val => {
            dataWASM.push_back(val);
        });
        this.wasmModule.AwsFilenamesCallback(itemName, dataWASM);
        dataWASM.delete();
    }

    /** Callback from WASM->AssetManager->WASM */
    AwsGetItemDataCallback(data: ArrayBuffer, itemPath: string) {
        let itemData: WASMUint8Array = new this.wasmModule.VectorUint8();
        new Uint8Array(data).forEach(val => {
            itemData.push_back(val);
        });
        this.wasmModule.AwsGetItemDataCallback(itemData, itemPath);
        itemData.delete();
    }

    /** Load a prefab from ID into existing ents */
    LoadPrefabByIdToExisting(prefabId: string, overwrite: boolean) {
        this.wasmModule.LoadPrefabByIdToExisting(prefabId, overwrite);
    }

    /** When in Editor and we want to refresh a prefab's data */
    ReloadPrefabData(prefabLocation: string, prefabName: string, data: ArrayBuffer) {
        let prefabData: WASMUint8Array = new this.wasmModule.VectorUint8();
        new Uint8Array(data).forEach(val => {
            prefabData.push_back(val);
        });
        this.wasmModule.ReloadPrefabData(prefabLocation, prefabName, prefabData);
        prefabData.delete();
    }

    ProcessServerMessage(data: ArrayBuffer) {
        let serverMessage: WASMUint8Array = new this.wasmModule.VectorUint8();
        new Uint8Array(data).forEach(val => {
            serverMessage.push_back(val);
        });
        this.wasmModule.ProcessServerMessage(serverMessage);
        serverMessage.delete();
    }

    /** once initial networking message has been recieved should know our playerid */
    GetplayerId(): string {
        return this.wasmModule.GetplayerId();
    }

    /** In seconds between us and server */
    GetEstimatedLatency(): number {
        return this.wasmModule.GetEstimatedLatency();
    }

    RegenerateNavmesh() {
        this.wasmModule.RegenerateNavmesh();
    }

    GetRandomPointOnNavmesh(): EntVector3 {
        return this.wasmModule.GetRandomPointOnNavmesh();
    }

    GetRandomPointOnNavmeshInRadius(center: EntVector3, radius: number): EntVector3 {
        return this.wasmModule.GetRandomPointOnNavmeshInRadius(center, radius);
    }

    /** Dispose of this WASM wrapper */
    dispose() {
        //@ts-ignore
        delete window.WASMModules[this.uuid];
        DisposeOfObject(this);
    }
}

/** Convert WASM Uint8 output to TS friendly version */
export function WASMArrayToUint8(data: WASMUint8Array): number[] {
    const loadData: number[] = [];
    for (let i = 0; i < data.size(); i++) {
        loadData.push(data.get(i));
    }
    data.delete();
    return loadData;
}

/** Convert WASM JSEntity output to TS friendly version */
export function WASMArrayToJSEntity(data: WASMJSEntityArray): JSEntity[] {
    const loadData: number[] = [];
    for (let i = 0; i < data.size(); i++) {
        loadData.push(data.get(i));
    }
    data.delete();
    return loadData;
}
