import { Vector3 } from "@babylonjs/core";
import { EntVector4 } from "../EntitySystem/CoreComponents";
import { ExitPointerLock } from "../Utils/SceneUtils";
import { GameEcosystem } from "../GameEcosystem";
import { PlayerCamera } from "./PlayerCamera";

/** TODO: Fix this class after componentization */
export class PlayerOrbitalCamera {
    offset = new Vector3();
    priorFistPerson = false;
    priorPan = new Vector3();
    isOrbit = false;
    ecosystem: GameEcosystem;

    getPlayerCamera(): PlayerCamera {
        return this.ecosystem.camera;
    }

    constructor(ecosystem: GameEcosystem) {
        this.ecosystem = ecosystem;
    }

    ToggleOrbitalCamera() {
        if (this.isOrbit) {
            this.ExitOrbitalCamera();
        } else {
            this.EnterOrbitalCamera();
        }
    }

    SetSpringArmEnabled(bEnabled: boolean) {
        this.getPlayerCamera().updateSpringArmLength = bEnabled;
    }

    EnterOrbitalCamera() {
        this.priorFistPerson = this.getPlayerCamera().firstPersonMode;
        this.priorPan = this.getPlayerCamera().rotationViewOffset.clone();
        this.isOrbit = true;
    }

    ExitOrbitalCamera() {
        this.getPlayerCamera().firstPersonMode = this.priorFistPerson;
        this.getPlayerCamera().rotationViewOffset = this.priorPan;
        this.getPlayerCamera().manualPanOverride = undefined;
        this.isOrbit = false;
    }

    //This takes the player camera and overrides it into orbital mode
    UpdateOrbitalCamera(center: Vector3) {
        if (this.isOrbit === false) {
            return;
        }
        this.getPlayerCamera().UpdateCamera(center.add(this.offset), new EntVector4(0, 0, 0, 1), this.ecosystem);
        this.updateCameraMMBOffset();
        this.updateCameraWASDOffset();
        this.getPlayerCamera().firstPersonMode = false;
        this.getPlayerCamera().manualPanOverride =
            this.ecosystem.InputValues.middleClick.isActive &&
            this.ecosystem.InputValues.buildAltAlt.isActive === false;
        ExitPointerLock();
    }

    protected updateCameraMMBOffset() {
        if (
            this.ecosystem.InputValues.middleClick.isActive === false ||
            this.ecosystem.InputValues.buildAltAlt.isActive === false
        ) {
            return;
        }
        const mouseX = this.ecosystem.InputValues.mouseX * this.ecosystem.deltaTime * -2;
        const mouseY = this.ecosystem.InputValues.mouseY * this.ecosystem.deltaTime * 2;
        this.offset = this.offset.add(this.getPlayerCamera()._camRoot.right.multiplyByFloats(mouseX, mouseX, mouseX));
        this.offset = this.offset.add(this.getPlayerCamera()._camRoot.up.multiplyByFloats(mouseY, mouseY, mouseY));
    }

    protected updateCameraWASDOffset() {
        const root = this.getPlayerCamera()._camRoot;
        const forward = this.ecosystem.InputValues.forward * this.ecosystem.deltaTime * 5;
        this.offset = this.offset.add(root.forward.multiplyByFloats(forward, forward, forward));
    }
}
