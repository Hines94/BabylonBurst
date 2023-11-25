import { RunnableClientEcosystem } from "@BabylonBurstClient/RunnableClientEcosystem";
import { CustomEditorHTML } from "./HTML/CustomEditorHTML";
import { EditorCamera } from "./Utils/EditorCamera";
import { ShowToastError, ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { UpdateEditorTick } from "@userCode/EditorMain";

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
export class BabylonBurstEditor extends RunnableClientEcosystem {
    options: editorOptions;

    isGame = false;
    isEditor = true;

    DisplayErrorIfEditor = (message: string) => {
        ShowToastError(message, this.doc);
    };
    DisplayMessageIfEditor = (message: string) => {
        ShowToastNotification(message, 3000, this.doc);
    };
    DisplayError = (message: string) => {
        ShowToastError(message, this.doc);
    };

    constructor(canvas: HTMLCanvasElement, options: editorOptions) {
        super(canvas);
        this.options = options;
        //environmentVaraibleTracker.SetOverrideVariable("USE_MEMORY_FRONTEND","true");
    }

    protected override async setupExtras(): Promise<void> {
        //Load in CSV with our buildables on it
        await this.setupEditor();
    }

    editorHTML: CustomEditorHTML;
    async setupEditor() {
        if (!this.options.noHTML) {
            this.editorHTML = new CustomEditorHTML(this);
            await this.editorHTML.setupHTML();
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
        UpdateEditorTick(this);
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
