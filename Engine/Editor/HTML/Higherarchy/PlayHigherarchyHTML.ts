import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { HigherarchyHTML } from "./HigherarchyHTML";
import { SetupAllEditorVisualisations } from "../HTMLUtils/VisualAidUtils";

declare function FetchInjectAdditionalHTML(arg: string): Promise<any>;


/** The 'play' version of our higherarchy. Deliberately more specific and efficient with data as we could have a large number of ents. */
export class PlayHigherarchyHTML extends HigherarchyHTML {
    //TODO: Keep only data on entity id's & prefab nests in higherarchy
    //TODO: Refresh data on load inspector for an entity

    async SetupPlayHigherarchy(ecosystem:GameEcosystem) {
        this.ecosystem = ecosystem;
        await ecosystem.waitLoadedPromise;

        //Inject all the editor stuff we need first
        await FetchInjectAdditionalHTML("/HTMLTemplates/EditorTemplate");

        //Hide the Content browser
        (ecosystem.doc.querySelector("#ContentBrowser") as HTMLElement).style.display = "none";
        this.windowDoc = ecosystem.doc;
        this.setupEditorPanel();

        //Visualistaions
        SetupAllEditorVisualisations(ecosystem);
        this.RefreshDataToWASMCore();
        this.RegenerateHigherarchy();
    }

}