import { GameEcosystem } from "@engine/GameEcosystem";
import { UpdateRTSCamera } from "./RTSCameraUpdater";

export function UpdateTick(ecosystem: GameEcosystem) {
    UpdateRTSCamera(ecosystem);
}
