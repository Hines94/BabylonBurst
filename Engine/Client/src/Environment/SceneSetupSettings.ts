import {
    Color4,
    Scene,
    SceneOptimizer,
    Vector3,
    Animation,
    AnimationPropertiesOverride,
    MeshBuilder,
    SceneOptimizerOptions,
    HardwareScalingOptimization,
    PickingInfo,
    HemisphericLight,
    Texture,
    CubeTexture,
    StandardMaterial,
} from "@babylonjs/core";
import { GridFloorOverlay } from "./GridFloorOverlay";
// import { AdminDebugInterface } from "../Admin/AdminDebugInterface";
import { GetGameSettings } from "../Settings";
import { DebugMode, environmentVaraibleTracker } from "../Utils/EnvironmentVariableTracker";
import { defaultLayerMask } from "../Utils/LayerMasks";

function fakePickMoveFunction(): PickingInfo {
    return new PickingInfo();
}

/**
 * Performs initial/persistent setup for scene items
 * LevelManager deals with non-persistent items
 */
export class SceneSetupSettings {
    scene: Scene;
    optimizer: SceneOptimizer;
    tileFloor: GridFloorOverlay;

    //SETUP PARAMS
    sceneBounds = 100;

    fullySetup = false;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    sceneFullySetup(): boolean {
        return this.fullySetup;
    }

    /** Overall async method to setup our scene.
     *  Will spawn/setup everything we need to play a certain scene/level */
    async setupScene() {
        this.scene.skipPointerMovePicking = true;
        this.scene.skipPointerDownPicking = true;
        this.scene.skipPointerUpPicking = true;
        this.scene._inputManager._pickMove = fakePickMoveFunction;
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.setupOptimization();
        this.setupBackground();
        //TEMP LIGHT
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.5;
        if (environmentVaraibleTracker.GetDebugMode() >= DebugMode.Light) {
            //this.tileFloor = new GridFloorOverlay(scene,{gridWidthX:10,gridWidthY:10,gridTileSize:10,tileMargin:0.05,gridColor:new Color4(0.2,0.2,0.2,0.1)});
        }
        //this.adminInterface = new AdminDebugInterface("ADMINDEBUGOBJECT", scene);
        this.fullySetup = true;
    }

    SetAnimationInterp(bOn: boolean) {
        Animation.AllowMatricesInterpolation = bOn;
        //TODO: Need this looping?
        this.scene.animationPropertiesOverride = new AnimationPropertiesOverride();
        this.scene.animationPropertiesOverride.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
    }

    private setupOptimization() {
        //Optimize
        var options = new SceneOptimizerOptions();
        options.addOptimization(new HardwareScalingOptimization(0, 1));

        // Optimizer
        this.optimizer = new SceneOptimizer(this.scene, options);
        this.optimizer.targetFrameRate = 120;
    }

    private setupBackground() {
        //TODO: Setup skybox?
        // var skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, this.scene);
        // skybox.layerMask = defaultLayerMask;
        // var skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        // skyboxMaterial.backFaceCulling = false;
        // var files = [
        //     "./textures/skybox/left.png",
        //     "./textures/skybox/up.png",
        //     "./textures/skybox/front.png",
        //     "./textures/skybox/right.png",
        //     "./textures/skybox/down.png",
        //     "./textures/skybox/back.png",
        // ];
        // //@ts-ignore
        // skyboxMaterial.reflectionTexture = CubeTexture.CreateFromImages(files, this.scene);
        // skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        // skyboxMaterial.disableLighting = true;
        // skybox.material = skyboxMaterial;
    }
}
