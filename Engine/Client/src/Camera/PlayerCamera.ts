import {
    Vector3,
    Scene,
    TransformNode,
    UniversalCamera,
    DefaultRenderingPipeline,
    Vector2,
    Camera,
    Matrix,
    Observer,
} from "@babylonjs/core";
import { GetGameSettings } from "../Settings";
import { defaultLayerMask, uiLayerMask, vfxLayer } from "../Utils/LayerMasks";
import { Clamp, Clamp01, lerp } from "../Utils/MathUtils";
import {
    EnterPointerLock,
    ExitPointerLock,
    GetMousePosAccountLock,
    IsPointerLockActive,
    SetupOrthographicCamera,
} from "../Utils/SceneUtils";
import { EntVector4 } from "../EntitySystem/CoreComponents";
import { AxisType, GetNormalizedAxisForEntRotation } from "../Utils/EntSystemUtils";
import { GameEcosystem } from "../../../Shared/src/GameEcosystem";

const CamFOV = 1;

export class PlayerCamera {
    camMovementSpeed = 2;
    camSprintMovementSpeed = 5;
    springArmMax = 250;
    springArmMin = 5;
    springArmLength = 10;
    springScrollSpeed = 0.5;
    viewRotationSpeed = 100;
    mouseRotationSpeed = 0.7;
    fovMin = 0.9;
    fovMax = 1.2;
    scene: Scene;
    _camRoot: TransformNode;
    shakeRoot: TransformNode;
    mainCamera: UniversalCamera;
    //A second camera that renders our UI in front of main cam
    additionalCameras: UniversalCamera[];

    currentMovingItem: TransformNode;

    resizeObserver: Observer<null>;

    /** WARNING: Can lead to disconnect between char and cam if moving (Looks like chuggies) */
    usePositionSmoothing = true;
    /** Ammount of time if smoothing to smooth over */
    positionSmoothingTime = 0.1;
    nonLockRotSpeedMulti = 2;
    panSpeed = 5;

    //Culling setup
    GetCullPreventionCenter(): Vector2 {
        return new Vector2(this._camRoot.absolutePosition.x, this._camRoot.absolutePosition.z);
    }
    cullPreventionRadius: number = 25;

    constructor(ecosystem: GameEcosystem) {
        ecosystem.camera = this;
        this.scene = ecosystem.scene;
        //root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("Camera Root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);
        this.shakeRoot = new TransformNode("Shake root");
        this.shakeRoot.parent = this._camRoot;

        //our actual camera that's pointing at our root's position
        this.mainCamera = new UniversalCamera("Main Camera", new Vector3(), this.scene);
        this.mainCamera.lockedTarget = this._camRoot.position;
        this.mainCamera.fov = CamFOV;
        this.mainCamera.parent = this.shakeRoot;
        this.mainCamera.layerMask = defaultLayerMask;
        //this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this.scene.activeCameras.push(this.mainCamera);

        this.additionalCameras = [];
        this.CreateAdditionalCamera(vfxLayer);
        this.CreateAdditionalCamera(uiLayerMask);

        this.updateSpringArm(this.springArmLength);
        this.setupRendering();
    }

    CreateAdditionalCamera(layer: number): UniversalCamera {
        const newCam = new UniversalCamera("LayerCamera_" + layer, new Vector3(0, 0, 0), this.scene);
        newCam.parent = this.mainCamera;
        newCam.position = new Vector3(0, 0, 0);
        newCam.rotation = new Vector3(0, 0, 0);
        newCam.layerMask = layer;
        newCam.fov = CamFOV;
        this.scene.activeCameras.push(newCam);
        this.additionalCameras.push(newCam);
        return newCam;
    }

    RemoveCamera(layer: number) {
        var found: Camera;
        for (var c = 0; c < this.additionalCameras.length; c++) {
            if (this.additionalCameras[c].layerMask === layer) {
                found = this.additionalCameras[c];
                break;
            }
        }
        if (found !== undefined) {
            this.additionalCameras = this.additionalCameras.filter(c => c !== found);
            found.dispose();
        }
    }

    SetAdditionalCamerasEnabled(bEnabled: Boolean) {
        if (bEnabled === true) {
            this.scene.activeCameras = this.scene.activeCameras.concat(
                this.additionalCameras.filter(c => this.scene.activeCameras.includes(c) === false)
            );
        } else {
            this.scene.activeCameras = this.scene.activeCameras.filter(
                c => this.additionalCameras.includes(c as UniversalCamera) === false
            );
        }
    }

    private updateSpringArm(length: number) {
        if (this.updateSpringArmLength === false) {
            return;
        }
        this.springArmLength = Clamp(length, this.springArmMin, this.springArmMax);
        this.ForceSpringArmLength(this.springArmLength);
        //TODO: Fix fog?
        //this.scene.fogDensity=gameClient.levelManager.currentLoadedLevel.fogDensity*(1+(1-(this.springArmLength/this.springArmMax)));
    }

    ForceSpringArmLength(length: number) {
        this.springArmLength = length;
        const alpha = Clamp01((this.springArmLength - this.springArmMin) / (this.springArmMax - this.springArmMin));
        const newFov = lerp(this.fovMin, this.fovMax, alpha);
        this.mainCamera.fov = newFov;
        for (var a = 0; a < this.additionalCameras.length; a++) {
            this.additionalCameras[a].fov = newFov;
        }
        this.mainCamera.position = new Vector3(0, this.springArmLength, this.springArmLength);
    }

    pipeline: DefaultRenderingPipeline = null;
    setupRendering() {
        if (this.pipeline === null) {
            this.pipeline = new DefaultRenderingPipeline("default", true, this.scene, [this.mainCamera]);
        }
        //AA
        this.pipeline.fxaaEnabled = GetGameSettings().FXAASamples > 0;
        if (this.pipeline.fxaaEnabled) {
            this.pipeline.samples = GetGameSettings().FXAASamples;
        }
        //TODO: Get settings for specific?
    }

    firstPersonMode = true;
    updateSpringArmLength = true;

    /** Update our camera to smoothly follow a position */
    UpdateCamera(desiredPos: Vector3, desiredRot: EntVector4, ecosystem: GameEcosystem) {
        this._camRoot.position = desiredPos;
        if (ecosystem.InputValues.Bkey.wasJustActivated()) {
            this.firstPersonMode = !this.firstPersonMode;
        }
        var CamOffset = GetNormalizedAxisForEntRotation(new EntVector4(), AxisType.BackwardAxis).multiplyByFloats(
            this.springArmLength,
            this.springArmLength,
            this.springArmLength
        );
        if (this.firstPersonMode === true) {
            const multi = 0.000000001;
            CamOffset = CamOffset.multiplyByFloats(multi, multi, multi);
            this.mainCamera.fov = this.fovMin;
        } else {
            this.updateSpringArm(
                this.springArmLength -
                    ecosystem.InputValues.mouseWheel * ecosystem.deltaTime * this.springScrollSpeed * this.springArmMax
            );
        }
        this.mainCamera.position = CamOffset;
        this.UpdateLook(desiredRot, ecosystem);
    }

    SetupAsOrthographic(dist: number) {
        for (var i = 0; i < this.additionalCameras.length; i++) {
            SetupOrthographicCamera(this.additionalCameras[i], dist);
        }
        SetupOrthographicCamera(this.mainCamera, dist);
    }

    //Desired change for actual controlled item PER SECOND
    DesiredRotationChange = { x: 0, y: 0, z: 0 };

    rotationViewOffset = new Vector3();
    manualPanOverride: boolean;

    UpdateLook(desiredRot: EntVector4, ecosystem: GameEcosystem) {
        const eng = this.scene.getEngine();

        //TODO: Move this out to more appropriate
        if (ecosystem.InputValues.Vkey.wasJustActivated()) {
            if (IsPointerLockActive()) {
                ExitPointerLock();
            } else {
                EnterPointerLock(eng);
            }
        }
        const lockActive = IsPointerLockActive();
        var active = lockActive || ecosystem.InputValues.middleClick.isActive;
        var panning = ecosystem.InputValues.panKey.isActive;
        if (this.manualPanOverride !== undefined) {
            active = this.manualPanOverride;
            panning = this.manualPanOverride;
        }
        if (this.firstPersonMode) {
            panning = false;
        }

        //Get mouse desired values
        var rotSpeed = this.viewRotationSpeed * this.mouseRotationSpeed;
        if (lockActive === false) {
            rotSpeed = rotSpeed * this.nonLockRotSpeedMulti;
        }

        const height = this.scene.getEngine().getRenderHeight(true);
        const width = this.scene.getEngine().getRenderWidth(true);

        this.DesiredRotationChange.x = (ecosystem.InputValues.mouseX / width) * -rotSpeed;
        this.DesiredRotationChange.y = (ecosystem.InputValues.mouseY / height) * rotSpeed;
        this.DesiredRotationChange.z = -ecosystem.InputValues.roll;
        if (active === false || panning) {
            this.DesiredRotationChange.x = 0;
        }
        if (active === false || panning) {
            this.DesiredRotationChange.y = 0;
        }

        if (panning && active) {
            this.rotationViewOffset.y += ecosystem.InputValues.mouseX * rotSpeed * this.panSpeed;
            this.rotationViewOffset.x += ecosystem.InputValues.mouseY * rotSpeed * this.panSpeed;
        }
        const offset = EntVector4.EulerToQuaternion(this.rotationViewOffset);
        const final = EntVector4.Multiply(offset, desiredRot);
        this._camRoot.rotationQuaternion = EntVector4.GetQuaternion(final);
    }
}

export function GetMousePickingRay(ecosystem: GameEcosystem) {
    const screenPos = GetMousePosAccountLock(ecosystem.scene);
    const camRay = ecosystem.scene.createPickingRay(
        screenPos.x,
        screenPos.y,
        Matrix.Identity(),
        ecosystem.camera.mainCamera,
        false
    );
    return camRay;
}
