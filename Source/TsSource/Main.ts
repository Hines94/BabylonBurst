import { GameEcosystem } from "@engine/GameEcosystem";
import { UpdateCamera } from "@userCode/CameraUpdater";
import { SendDataToServer } from "@userCode/PlayerDataToServer";


export function UpdateTick(ecosystem:GameEcosystem) {
    UpdateCamera(ecosystem);
    SendDataToServer(ecosystem);
}