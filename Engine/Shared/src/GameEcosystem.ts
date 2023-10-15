import { Observable, Scene } from "@babylonjs/core";
import { SceneSetupSettings } from "../../Client/src/Environment/SceneSetupSettings";
import { WindowInputValues } from "../../Client/src/InputModule";
import { EntitySystem } from "./EntitySystem/EntitySystem";

/** Contains key parts to run a game ecosystem (render etc) */
export interface GameEcosystem {
    //---GENERAL---
    uuid: string;
    window: Window;
    deltaTime: number;
    dynamicProperties: { [key: string]: any };
    InputValues: WindowInputValues;
    entitySystem: EntitySystem;

    //---HTML/GUI related---
    controlHasFocus: boolean;
    hoveredOverGUI: boolean;
    canvas: HTMLCanvasElement;
    doc: Document;

    //---SCENE---
    camera: any;
    sceneSettings: SceneSetupSettings;
    scene: Scene;

    /** Can wait for this if we need to run things after ecosystem fully setup */
    waitLoadedPromise: Promise<GameEcosystem>;
    /** Small method that will give a hook into updates BEFORE game loop is run */
    onUpdate: Observable<GameEcosystem>;
    dispose(): void;
}
