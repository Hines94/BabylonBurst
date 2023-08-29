import { GameEcosystem } from "../../Engine/Client/src/GameEcosystem";
import { MessageToServType, serverConnection } from "../../Engine/Client/src/Networking/ServerConnection";

export class ServerFrameDataRequest {
    Forward: number;
    Side: number;
    Up: number;
    Yaw: number;
    Pitch: number;
    Roll: number;
}

export var ThisFrameServerData = new ServerFrameDataRequest();

export function SendDataToServer(ecosystem: GameEcosystem) {
    if (serverConnection === undefined) {
        return;
    }

    setInputsForFrame(ecosystem);

    serverConnection.SendMessageToServer(JSON.stringify(ThisFrameServerData), MessageToServType.inputs);
    //Reset message for new frame
    ThisFrameServerData = new ServerFrameDataRequest();
}

function setInputsForFrame(ecosystem: GameEcosystem) {
    ThisFrameServerData.Forward = ecosystem.InputValues.forward;
    ThisFrameServerData.Side = ecosystem.InputValues.side;
    ThisFrameServerData.Up = ecosystem.InputValues.up;

    //View Change?
    //TODO: If in player mode then locked cursor?
    ThisFrameServerData.Yaw = ecosystem.camera.DesiredRotationChange.x;
    ThisFrameServerData.Pitch = ecosystem.camera.DesiredRotationChange.y;
    ThisFrameServerData.Roll = ecosystem.camera.DesiredRotationChange.z;
    //console.log(ThisFrameServerData.RequestPitchLook)
}
