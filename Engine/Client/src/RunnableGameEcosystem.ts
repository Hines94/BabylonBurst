import { Engine, Observable, Scene, Vector3 } from "@babylonjs/core";
import { SceneSetupSettings } from "./Environment/SceneSetupSettings";
import { SetupInputsModule, UpdateInputValues, UpdateInputValuesEndFrame, WindowInputValues } from "./InputModule";
import { SimpleWeightedSmoothWithSteps } from "../../Shared/src/Utils/MathUtils";
import { UpdateAllTickables } from "./Utils/BaseTickableObject";
import { v4 as uuidv4 } from "uuid";
import { UpdateSystemsLoop } from "./SystemsLoop";
import { PlayerCamera } from "./Camera/PlayerCamera";
import { GetGameSettings } from "./Settings";
import { GameEcosystem } from "@engine/GameEcosystem";
import { EntitySystem } from "@engine/EntitySystem/EntitySystem";
import { setupAsyncManager } from "@BabylonBurstClient/Setup/AWSAssetSetup";
import { PrefabManager } from "@engine/EntitySystem/PrefabManager";
import { setupAutoNavBuildSystem } from "@engine/Navigation/NavigationBuildSystem";

/** Custom game launch - eg editor or client side performance checks */
export class RunnableGameEcosystem implements GameEcosystem {
    //Maximum bounds of the world
    worldRadius = 50;
    worldHeight = 20;
    tileSize = 1;

    uuid = uuidv4();
    window: Window;
    canvas: HTMLCanvasElement;
    doc: Document;
    deltaTime = 0.00001;
    scene: Scene;
    dynamicProperties: { [key: string]: any } = {};
    InputValues = new WindowInputValues();

    entitySystem = new EntitySystem();
    engine: Engine;
    sceneSettings: SceneSetupSettings;
    gameSetup = false;
    camera: PlayerCamera;
    onUpdate = new Observable<GameEcosystem>();
    controlHasFocus: boolean;
    hoveredOverGUI: boolean;

    constructor(canvas: HTMLCanvasElement) {
        this.doc = canvas.ownerDocument;
        this.setupCanvas(canvas);
        this.setupEngineRunLoop(canvas);
    }

    dispose(): void {
        this.entitySystem.ResetSystem();
        this.engine.dispose();
    }
    private waitLoadResolve: any;
    waitLoadedPromise: Promise<GameEcosystem> = new Promise((resolve, reject) => {
        this.waitLoadResolve = resolve;
    });

    setupCanvas(canvas: HTMLCanvasElement) {
        canvas.id = "gameCanvas";
        canvas.className = "gameCanvas";
        this.canvas = canvas;
        this.window = this.canvas.ownerDocument.defaultView;
        //Not worth using worker thread as communication too much!
    }

    async setupEngineRunLoop(canvas: HTMLCanvasElement) {
        await this.setupEngine(canvas);
        await setupAsyncManager();
        await PrefabManager.GetPrefabManager().setupAllPrefabs();
        setupAutoNavBuildSystem(this);
        //Window resize utils
        const ecosystem = this;
        canvas.ownerDocument.defaultView.onresize = function () {
            ecosystem.engine.resize();
        };
        this.setupScene();
        this.camera = new PlayerCamera(this);
        GetGameSettings().OnSceneLoaded(this);
        this.waitLoadResolve(this);
        console.log(`Ecosystem: ${this.uuid} completed setup and starting game loop.`);
        this.runGameLoop();
    }

    private async setupEngine(canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true, {}, true);
        // const engine = new WebGPUEngine(canvas);
        // await engine.initAsync();
        // this.engine = engine;
        this.engine.enableOfflineSupport = false;
    }

    async setupScene() {
        this.scene = new Scene(this.engine);
        this.sceneSettings = new SceneSetupSettings(this.scene);
        await this.sceneSettings.setupScene();

        this.setupExtras();

        //Perform setup on various systems
        SetupInputsModule(this);

        this.gameSetup = true;
    }

    runRenderLoop = true;

    stopGameLoop() {
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
    }

    runGameLoop(): void {
        if (!this.runRenderLoop) {
            return;
        }
        this.engine.runRenderLoop(() => {
            if (this.gameSetup === false) {
                return;
            }
            if (this.scene == undefined) {
                console.error("No scene!");
                return;
            }
            //Make sure we don't need this!
            this.scene.cleanCachedTextureBuffer();
            this.updateTick();
            this.onUpdate.notifyObservers(this);
            this.updateLoop();
            if (this.scene.cameras.length > 0) {
                this.scene.render();
            }
        });
    }
    protected setupExtras() {}

    private updateLoop() {
        UpdateInputValues(this);
        this.updateEcosystemLoop();
        UpdateInputValuesEndFrame(this);
    }

    /** General update for this ecosystem to update inputs etc */
    protected updateEcosystemLoop() {
        //Input values updated first so other systems know if we have clicked etc
        UpdateAllTickables(this);
        UpdateSystemsLoop(this, this.updateWindowSpecificSystems.bind(this));
    }
    /** Specific window systems such as Editor systems or game specific systems */
    protected updateWindowSpecificSystems(ecosystem: GameEcosystem) {}

    /** Get our delta time */
    updateTick(): void {
        //This is more accurate than engine!
        var NewTick = performance.now();
        //Convert to S from ms
        const newDeltaTime = Math.max((NewTick - this.lastTick) / 1000, 0.0000001);
        this.deltaTime = SimpleWeightedSmoothWithSteps(this.deltaTime, newDeltaTime, 6);
        this.lastTick = NewTick;
    }
    lastTick = 0;
}
