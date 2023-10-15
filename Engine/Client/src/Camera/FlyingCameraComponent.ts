import { Vector3 } from "@babylonjs/core";
import { PlayerCamera } from "@engine/Camera/PlayerCamera";
import { GameEcosystem } from "@engine/GameEcosystem";

export class FlyingCameraComponent {
    ecosystem: GameEcosystem;
    playerCam: PlayerCamera;

    /** Speed at which this camera should move from user input */
    movementSpeed = 10;

    /** If hold shift etc speed boost */
    movementBoostMultiplier = 2;

    constructor(ecosystem: GameEcosystem) {
        this.ecosystem = ecosystem;
        this.playerCam = ecosystem.camera as PlayerCamera;
    }

    movementBoostActive = false;

    UpdateFlyingCameraComponent(forwardAxis: number, rightAxis: number, upAxis: number) {
        var moveSens = this.movementSpeed;
        if (this.movementBoostActive) {
            moveSens = moveSens * this.movementBoostMultiplier;
        }

        const totalDesiredMovement = new Vector3(forwardAxis, rightAxis, upAxis);
        const normalizedDesiredMovement = totalDesiredMovement.normalize(); // Normalize the movement vector.

        var scaledDesiredMovement = normalizedDesiredMovement.scale(this.ecosystem.deltaTime * moveSens);

        const movementRoot = this.GetMovementRoot();
        movementRoot.position = movementRoot.position.add(movementRoot.forward.scale(scaledDesiredMovement.x));
        movementRoot.position = movementRoot.position.add(movementRoot.right.scale(scaledDesiredMovement.y));
        movementRoot.position = movementRoot.position.add(movementRoot.up.scale(scaledDesiredMovement.z));
    }

    GetMovementRoot() {
        return this.playerCam.GetCameraRoot();
    }
}
