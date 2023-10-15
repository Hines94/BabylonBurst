import { TransformNode, Vector3 } from "@babylonjs/core";
import { PlayerCamera } from "@engine/Camera/PlayerCamera";
import { GameEcosystem } from "@engine/GameEcosystem";
import { Clamp, Clamp01, lerp } from "@engine/Utils/MathUtils";

/** Generic spring arm comp. Should be applicable in a wide range of senarios (3rd person, RTS etc). root->spring arm->cameras.*/
export class SpringArmCameraComponent {
    ecosystem: GameEcosystem;
    playerCam: PlayerCamera;
    springArmRoot: TransformNode;

    /** Speed we scroll small->large in 1 sec */
    springArmScrollSpeed = 0.5;
    /** Maximum length of our spring arm */
    springArmMax = 250;
    /** Minimum length of our spring arm */
    springArmMin = 5;
    /** Current length of our spring arm */
    springArmLength = 10;
    /** Spring arm direction at maximum length */
    springArmDirectionMax = new Vector3(0, 0.7, -0.3);
    /** Spring arm direction at minimum length */
    springArmDirectionMin = new Vector3(0, 0.5, -0.5);

    /** As our spring arm length changes we also change FOV to focus/defocus user attention */
    bAlterFOV = true;
    /** FOV at smallest spring arm length */
    fovMin = 0.9;
    /** FOV at largest spring arm length */
    fovMax = 1.2;

    constructor(ecosystem: GameEcosystem) {
        this.ecosystem = ecosystem;
        this.playerCam = this.ecosystem.camera as PlayerCamera;
        if (this.playerCam.bSpringArmComp) {
            console.error("Tried to add two spring arm comps to player camera!");
            return;
        }
        this.playerCam.bSpringArmComp = true;
        this.playerCam.onCameraPosUpdate.add(this.PlayerCameraPosUpdate.bind(this));

        this.springArmRoot = new TransformNode("Camera Root");
        this.springArmRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        this.springArmRoot.rotation = new Vector3(0, 0, 0);

        this.playerCam.SetCustomRoot(this.springArmRoot);
        this.ResetCamPosition();
        this.playerCam.mainCamera.lockedTarget = this.springArmRoot.position;
    }

    /** Force our spring arm to be a fixed length (eg set to 0 for "first person mode") */
    ForceSpringArmLength(length: number) {
        this.UpdateSpringArmLength(length);
    }

    /** Axis of >0 will make spring arm longer and <0 will make smaller */
    UpdateSpringArmLength(axisValue: number) {
        this.springArmLength =
            this.springArmLength - axisValue * this.ecosystem.deltaTime * this.springArmScrollSpeed * this.springArmMax;
        this.springArmLength = Clamp(this.springArmLength, this.springArmMin, this.springArmMax);
        this.updateSpringArm(this.springArmLength);
    }

    /** Update our spring arm with additional or less length */
    private updateSpringArm(length: number) {
        this.springArmLength = length;
        const alpha = this.GetSpringArmAlpha();
        const newFov = lerp(this.fovMin, this.fovMax, alpha);
        this.playerCam.mainCamera.fov = newFov;
        for (var a = 0; a < this.playerCam.additionalCameras.length; a++) {
            this.playerCam.additionalCameras[a].fov = newFov;
        }
        this.ResetCamPosition();
    }

    private GetSpringArmAlpha() {
        return Clamp01((this.springArmLength - this.springArmMin) / (this.springArmMax - this.springArmMin));
    }

    private PlayerCameraPosUpdate(cam: PlayerCamera) {
        this.springArmRoot.position = this.playerCam.shakeRoot.position;
        this.playerCam.shakeRoot.position = new Vector3();
        this.ResetCamPosition();
    }

    private ResetCamPosition() {
        const direction = Vector3.Lerp(
            this.springArmDirectionMin,
            this.springArmDirectionMax,
            this.GetSpringArmAlpha()
        );
        this.playerCam.mainCamera.position = direction.multiplyByFloats(
            this.springArmLength,
            this.springArmLength,
            this.springArmLength
        );
    }
}
