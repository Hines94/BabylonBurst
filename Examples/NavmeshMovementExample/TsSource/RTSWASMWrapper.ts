import { LoadEntitiesFromMsgpackFormat, RawEntityData } from "@engine/EntitySystem/EntityMsgpackConverter";
import { ServerWASMModuleWrapper, WASMArrayToUint8 } from "@engine/WASM/ServerWASMModule";
import { EntVector3 } from "@engine/EntitySystem/CoreComponents"

export class RTSWASMWrapper{

    static SelectNearestEntity(pos:EntVector3, dir:EntVector3, wrapper:ServerWASMModuleWrapper): RawEntityData {
        const wasmPos = wrapper.CreateEntVector3(pos);
        const wasmDir = wrapper.CreateEntVector3(dir);
        const allData = LoadEntitiesFromMsgpackFormat(
            WASMArrayToUint8(wrapper.wasmModule.SelectNearestEntity(wasmPos,wasmDir))
        );
        wasmPos.delete();
        wasmDir.delete();
        return allData;
    }

    static IssueUnitsOrder(pos:EntVector3, dir:EntVector3, wrapper:ServerWASMModuleWrapper) : void {
        const wasmPos = wrapper.CreateEntVector3(pos);
        const wasmDir = wrapper.CreateEntVector3(dir);
        wrapper.wasmModule.IssueUnitsOrder(wasmPos,wasmDir);
        wasmPos.delete();
        wasmDir.delete();
    }

}