import { PlayerCamera } from "@BabylonBurstClient/Camera/PlayerCamera";
import { EnterPointerLock, ExitPointerLock, IsPointerLockActive } from "@BabylonBurstClient/Utils/SceneUtils";
import { Vector3 } from "@babylonjs/core";
import { EntVector4 } from "@engine/EntitySystem/CoreComponents";
import { GameEcosystem } from "@engine/GameEcosystem";

export class LookingCameraComponent {
    viewRotationSpeed = 100;
    mouseRotationSpeed = 0.7;
    nonLockRotSpeedMulti = 2;
    panSpeed = 5;

    rotationViewOffset = new Vector3();
    manualPanOverride: boolean;

    ecosystem: GameEcosystem;
    camera: PlayerCamera;

    constructor(ecosystem: GameEcosystem) {
        this.ecosystem = ecosystem;
        this.camera = this.ecosystem.camera as PlayerCamera;
        this.currentRotation = this.camera.shakeRoot.rotation.clone();
    }

    TogglePointerLockMode() {
        if (IsPointerLockActive()) {
            ExitPointerLock();
        } else {
            EnterPointerLock(this.ecosystem.scene.getEngine());
        }
    }

    //Desired change for actual controlled item PER SECOND
    DesiredRotationChange = { x: 0, y: 0, z: 0 };
    currentRotation = new Vector3();

    UpdateLook() {
        const lockActive = IsPointerLockActive();
        var active = lockActive || this.ecosystem.InputValues.middleClick.isActive;
        var panning = this.ecosystem.InputValues.CAPSKey.isActive;
        if (this.manualPanOverride !== undefined) {
            active = this.manualPanOverride;
            panning = this.manualPanOverride;
        }

        //Get mouse desired values
        var rotSpeed = this.viewRotationSpeed * this.mouseRotationSpeed;
        if (lockActive === false) {
            rotSpeed = rotSpeed * this.nonLockRotSpeedMulti;
        }

        const height = this.ecosystem.scene.getEngine().getRenderHeight(true);
        const width = this.ecosystem.scene.getEngine().getRenderWidth(true);

        this.DesiredRotationChange.x = (this.ecosystem.InputValues.mouseXDelta / width) * -rotSpeed;
        this.DesiredRotationChange.y = (this.ecosystem.InputValues.mouseYDelta / height) * rotSpeed;
        this.DesiredRotationChange.z = -this.ecosystem.InputValues.roll;
        if (active === false || panning) {
            this.DesiredRotationChange.x = 0;
        }
        if (active === false || panning) {
            this.DesiredRotationChange.y = 0;
        }

        const rotSens = 10;
        this.currentRotation.y =
            this.currentRotation.y + this.DesiredRotationChange.x * this.ecosystem.deltaTime * -rotSens;
        this.currentRotation.x =
            this.currentRotation.x + this.DesiredRotationChange.y * this.ecosystem.deltaTime * rotSens;

        if (panning && active) {
            this.rotationViewOffset.y += this.ecosystem.InputValues.mouseXDelta * rotSpeed * this.panSpeed;
            this.rotationViewOffset.x += this.ecosystem.InputValues.mouseYDelta * rotSpeed * this.panSpeed;
        }
        const offset = EntVector4.EulerToQuaternion(this.rotationViewOffset);
        const final = EntVector4.Multiply(offset, EntVector4.EulerToQuaternion(this.currentRotation));
        this.camera.GetCameraRoot().rotationQuaternion = EntVector4.GetQuaternion(final);
    }
}
