import { BabylonBurstClient } from "@BabylonBurstClient/BabylonBurstClient";
import { PlayHigherarchyHTML } from "./HTML/Higherarchy/PlayHigherarchyHTML";
import { ShowToastError, ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { RefreshObjectTypeTracking } from "./Utils/ContentTypeTrackers";
import { RefreshAllModelPaths } from "./Utils/EditorModelSpecifier";
import { UpdateEditorTick } from "@userCode/EditorMain";

/** Special version of the game client that allows entity inspection, editor visualistaions etc */
export class GameEditor extends BabylonBurstClient {
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

    protected override updateEcosystemLoop(): void {
        super.updateEcosystemLoop();
        UpdateEditorTick(this);
    }

    override async setupScene(): Promise<void> {
        console.log("Loading in Play-Editor mode");
        await super.setupScene();
        //Create higherarchy HTML that we can use to check various things
        const editorHigherarchy = new PlayHigherarchyHTML();
        editorHigherarchy.SetupPlayHigherarchy(this);
        await RefreshObjectTypeTracking();
        RefreshAllModelPaths();
    }
}
