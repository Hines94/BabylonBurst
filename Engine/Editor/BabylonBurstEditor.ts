import { Color4, Vector3 } from "@babylonjs/core";
import { CustomEditorHTML } from "./HTML/CustomEditorHTML";
import { RunnableGameEcosystem } from "@BabylonBurstClient/RunnableGameEcosystem"
import { EditorCamera } from "./Utils/EditorCamera";
import { GridFloorOverlay } from "@BabylonBurstClient/Environment/GridFloorOverlay";
import { AngleToRad } from "@engine/Utils/MathUtils";

export type BuildableDescript = {
    CodeName: string;
    FullName: string;
    Description: string;
    Category: string;
    PlacementDist: number;
    Higherarch: any;
    SnapPoints: any;
};

type editorOptions = {
    noHTML?: boolean;
    noCam?: boolean;
};

//This is the editor for generating/saving/loading different buildable types for our AI and players to use
export class BabylonBurstEditor extends RunnableGameEcosystem {
    options: editorOptions;
    constructor(canvas: HTMLCanvasElement, options: editorOptions) {
        super(canvas);
        this.options = options;
    }

    protected override setupExtras(): void {
        //Load in CSV with our buildables on it
        this.setupEditor();
    }

    editorHTML: CustomEditorHTML;
    async setupEditor() {
        if (!this.options.noHTML) {
            this.editorHTML = new CustomEditorHTML(this);
        }
    }

    cam: EditorCamera;
    override async setupScene(): Promise<void> {
        await super.setupScene();
        if (!this.options.noCam) {
            this.cam = new EditorCamera(this);
        }
        const gridfloor = new GridFloorOverlay(this.scene, {
            gridWidthX: 20,
            gridWidthY: 20,
            gridTileSize: 0.5,
            tileMargin: 0.05,
            gridColor: new Color4(0.1, 0.1, 0.1, 0.01),
        });
        gridfloor.moveableNode.rotation = new Vector3(AngleToRad(90), 0, 0);
    }

    protected override updateEcosystemLoop(): void {
        if (this.cam) {
            this.cam.UpdateCamera(this);
        }
        super.updateEcosystemLoop();
    }
}

function getTimestampString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
