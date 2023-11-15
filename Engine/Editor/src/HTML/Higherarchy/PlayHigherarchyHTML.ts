import { HigherarchyHTML } from "./HigherarchyHTML";
import { GameEcosystem } from "@engine/GameEcosystem";
import { SetupAllTopBarOptions } from "../HTMLUtils/TopBarSetup";

declare function FetchInjectAdditionalHTML(arg: string): Promise<any>;

/** The 'play' version of our higherarchy. Deliberately more specific and efficient with data as we could have a large number of ents. */
export class PlayHigherarchyHTML extends HigherarchyHTML {
    //TODO: Keep only data on entity id's & prefab nests in higherarchy
    //TODO: Refresh data on load inspector for an entity

    async SetupPlayHigherarchy(ecosystem: GameEcosystem) {
        this.setEcosystem(ecosystem);
        await ecosystem.waitLoadedPromise;

        //Inject all the editor stuff we need first
        const editorTemp = await FetchInjectAdditionalHTML("/HTMLTemplates/EditorTemplate");

        //Hide the Content browser
        (ecosystem.doc.querySelector("#ContentBrowser") as HTMLElement).style.display = "none";
        this.ecosystem.doc = ecosystem.doc;
        this.finishUISetup();

        SetupAllTopBarOptions(
            ecosystem,
            {},
            { bShowNavmeshByDefault: false },
            { bContentBrowserOption: false, bDefaultHigherarchy: false },
        );

        //Setup data for Higherarch
        this.RegenerateHigherarchy();
    }
}
