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

    //---ERRORCALLBACKS---
    /** Used for displaying important errors in Editor */
    DisplayErrorIfEditor:(message:string)=>void;
    /** Used for displaying important messages in Editor */
    DisplayMessageIfEditor:(message:string)=>void;
    /** Used for when a log.error is not enough. Will ping the users screen. */
    DisplayError:(message:string)=>void;

    /** Can wait for this if we need to run things after ecosystem fully setup */
    waitLoadedPromise: Promise<GameEcosystem>;
    /** Small method that will give a hook into updates BEFORE game loop is run */
    onUpdate: Observable<GameEcosystem>;
    dispose(): void;
}
