import { Mesh, MeshBuilder, Vector3 } from "@babylonjs/core";
import { LookingCameraComponent } from "@BabylonBurstClient/Camera/LookingCameraComponent"
import { PlayerCamera } from "@BabylonBurstClient/Camera/PlayerCamera";
import { FlyingCameraComponent } from "@BabylonBurstClient/Camera/FlyingCameraComponent"
import { GameEcosystem } from "@engine/GameEcosystem";
import { AngleToRad } from "@engine/Utils/MathUtils";

/** Simply takes the player camera and runs a simple movement  */
export class EditorCamera {
    sphereMesh: Mesh;
    lookingComp:LookingCameraComponent;
    playerCam:PlayerCamera;
    movementComp:FlyingCameraComponent;


    constructor(ecosystem: GameEcosystem) {
        this.sphereMesh = MeshBuilder.CreateSphere(
            "EditorSphere",
            {
                diameter: 1,
            },
            ecosystem.scene
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
        //Rotation
        this.lookingComp.UpdateLook();
        if(ecosystem.InputValues.Vkey.wasJustActivated()){
            this.lookingComp.TogglePointerLockMode();
        }
        
        //Movement
        this.movementComp.movementBoostActive = ecosystem.InputValues.shift.isActive;
        this.movementComp.UpdateFlyingCameraComponent(ecosystem.InputValues.forward,ecosystem.InputValues.side,ecosystem.InputValues.up);
        this.sphereMesh.position = this.playerCam.GetCameraRoot().position;
        this.sphereMesh.rotation = this.lookingComp.currentRotation;
    }
}
