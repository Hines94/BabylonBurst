import { FlyingCameraComponent } from "@engine/Camera/FlyingCameraComponent";
import { PlayerCamera } from "@engine/Camera/PlayerCamera";
import { SpringArmCameraComponent } from "@engine/Camera/SpringArmCameraComponent";
import { GameEcosystem } from "@engine/GameEcosystem";

var playerCamSpringArm:SpringArmCameraComponent;
var playerCamMovement:FlyingCameraComponent;

export function UpdateRTSCamera(ecosystem: GameEcosystem) {
    const playercam = ecosystem.camera as PlayerCamera;
    if(!playerCamSpringArm) {
        playerCamSpringArm = new SpringArmCameraComponent(ecosystem);
    }
    if(!playerCamMovement) {
        playerCamMovement = new FlyingCameraComponent(ecosystem);
    }

    playerCamSpringArm.UpdateSpringArmLength(ecosystem.InputValues.mouseWheel);
    playerCamMovement.movementBoostActive = ecosystem.InputValues.shift.isActive;
    playerCamMovement.UpdateFlyingCameraComponent(ecosystem.InputValues.forward,ecosystem.InputValues.side,0);
}