import { GameEcosystem } from "@engine/GameEcosystem";
import { UpdateRTSCamera } from "./RTSCameraUpdater";
import { UpdateUnitSelection } from "./RTSUnitSelector";

export function UpdateTick(ecosystem: GameEcosystem) {
    UpdateRTSCamera(ecosystem);

    UpdateUnitSelection(ecosystem);
}
