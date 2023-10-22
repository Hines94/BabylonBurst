import { Color4, Observable, Vector3 } from "@babylonjs/core";
import { CustomEditorHTML } from "./HTML/CustomEditorHTML";
import { RunnableGameEcosystem } from "@BabylonBurstClient/RunnableGameEcosystem"
import { EditorCamera } from "./Utils/EditorCamera";
import { EntityData } from "@engine/EntitySystem/EntityData";

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

    onEntitySelected = new Observable<EntityData>();

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
