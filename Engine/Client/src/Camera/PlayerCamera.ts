import {
    Vector3,
    Scene,
    TransformNode,
    UniversalCamera,
    DefaultRenderingPipeline,
    Camera,
    Matrix,
    Observer,
    Observable,
    Quaternion,
} from "@babylonjs/core";
import { GetGameSettings } from "../Settings";
import { defaultLayerMask, uiLayerMask } from "../Utils/LayerMasks";
import {
    EnterPointerLock,
    ExitPointerLock,
    GetMousePosAccountLock,
    IsPointerLockActive,
    SetupOrthographicCamera,
} from "../Utils/SceneUtils";
import { EntVector4 } from "../EntitySystem/CoreComponents";
import { GameEcosystem } from "../GameEcosystem";

const CamFOV = 1;

/** Minimal player camera.  */
export class PlayerCamera {
    camMovementSpeed = 2;
    camSprintMovementSpeed = 5;
    scene: Scene;
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

    bSpringArmComp = false;

    constructor(ecosystem: GameEcosystem) {
        ecosystem.camera = this;
        this.scene = ecosystem.scene;

        //to face the player from behind (180 degrees)
        this.shakeRoot = new TransformNode("Shake root");

        //Setup our main camera
        this.mainCamera = new UniversalCamera("Main Camera", new Vector3(), this.scene);
        this.mainCamera.fov = CamFOV;
        this.mainCamera.parent = this.shakeRoot;
        this.mainCamera.layerMask = defaultLayerMask;
        this.scene.activeCameras.push(this.mainCamera);

        this.additionalCameras = [];
        this.CreateAdditionalCamera(uiLayerMask);

        this.setupRendering();
    }

    /** Create additional cam that stacks on top our main camera for a layer (eg to view GUI over top of main cam) */
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

    /** Remove additional camera with given layer if it exists */
    RemoveAdditionalCamera(layer: number) {
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

    /** For additional cameras that layer over top of main camera set them enabled or disabled */
    SetAdditionalCamerasEnabled(bEnabled: Boolean) {
        if (bEnabled === true) {
            this.scene.activeCameras = this.scene.activeCameras.concat(
                this.additionalCameras.filter(c => this.scene.activeCameras.includes(c) === false),
            );
        } else {
            this.scene.activeCameras = this.scene.activeCameras.filter(
                c => this.additionalCameras.includes(c as UniversalCamera) === false,
            );
        }
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

    onCameraPosUpdate = new Observable<PlayerCamera>();

    /** Update our camera to smoothly follow a position */
    UpdateCameraPosition(desiredPos: Vector3) {
        this.shakeRoot.position = desiredPos;
        this.onCameraPosUpdate.notifyObservers(this);
    }

    UpdateCameraRotation(desiredRot: Quaternion) {
        this.shakeRoot.rotationQuaternion = desiredRot;
    }

    SetupAsOrthographic(dist: number) {
        for (var i = 0; i < this.additionalCameras.length; i++) {
            SetupOrthographicCamera(this.additionalCameras[i], dist);
        }
        SetupOrthographicCamera(this.mainCamera, dist);
    }

    GetCameraRoot(): TransformNode {
        if (this.customCameraRoot !== undefined) {
            return this.customCameraRoot;
        }
        return this.shakeRoot;
    }

    customCameraRoot: TransformNode;
    SetCustomRoot(root: TransformNode) {
        this.customCameraRoot = root;
        this.shakeRoot.parent = root;
        this.shakeRoot.position = new Vector3();
    }

    ResetCustomRoot() {
        this.shakeRoot.parent = undefined;
        this.customCameraRoot = undefined;
    }
}

export function GetMousePickingRay(ecosystem: GameEcosystem) {
    const screenPos = GetMousePosAccountLock(ecosystem.scene);
    const camRay = ecosystem.scene.createPickingRay(
        screenPos.x,
        screenPos.y,
        Matrix.Identity(),
        ecosystem.camera.mainCamera,
        false,
    );
    return camRay;
}
