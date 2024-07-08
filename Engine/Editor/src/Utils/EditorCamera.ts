import { Mesh, MeshBuilder, Vector3 } from "@babylonjs/core";
import { LookingCameraComponent } from "@BabylonBurstClient/Camera/LookingCameraComponent";
import { PlayerCamera } from "@BabylonBurstClient/Camera/PlayerCamera";
import { FlyingCameraComponent } from "@BabylonBurstClient/Camera/FlyingCameraComponent";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { AngleToRad } from "@BabylonBurstCore/Utils/MathUtils";
import { BasicKeybinds, EditorKeybinds } from "@BabylonBurstClient/InputModule";

/** Simply takes the player camera and runs a simple movement  */
export class EditorCamera {
    sphereMesh: Mesh;
    lookingComp: LookingCameraComponent;
    playerCam: PlayerCamera;
    movementComp: FlyingCameraComponent;

    constructor(ecosystem: GameEcosystem) {
        this.sphereMesh = MeshBuilder.CreateSphere(
            "EditorSphere",
            {
                diameter: 1,
            },
            ecosystem.scene,
        );
        this.lookingComp = new LookingCameraComponent(ecosystem);
        this.playerCam = ecosystem.camera as PlayerCamera;
        this.movementComp = new FlyingCameraComponent(ecosystem);
        this.playerCam.GetCameraRoot().position = new Vector3(0, 2, -5);
        this.lookingComp.currentRotation.x = AngleToRad(20);
    }

    UpdateCamera(ecosystem: GameEcosystem) {
        if (!ecosystem.InputValues) {
            return;
        }
        const basicInputs = ecosystem.InputValues as EditorKeybinds;

        if (!basicInputs.EDITORCHANGEPERSPECTIVE) return;

        //Rotation
        this.lookingComp.UpdateLook();
        if (basicInputs.EDITORCHANGEPERSPECTIVE.wasJustActivated()) {
            this.lookingComp.TogglePointerLockMode();
        }

        //Movement
        this.movementComp.movementBoostActive = basicInputs.EDITORZOOMCAMERA.isActive;
        this.movementComp.UpdateFlyingCameraComponent(
            basicInputs.EDITORFORWARDAXIS.axisValue,
            basicInputs.EDITORSIDEAXIS.axisValue,
            basicInputs.EDITORUPAXIS.axisValue,
        );
        this.sphereMesh.position = this.playerCam.GetCameraRoot().position;
        this.sphereMesh.rotation = this.lookingComp.currentRotation;
    }
}
