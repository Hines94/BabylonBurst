import { BabylonBurstClient } from "@BabylonBurstClient/BabylonBurstClient"
import { PlayHigherarchyHTML } from "./HTML/Higherarchy/PlayHigherarchyHTML";


/** Special version of the game client that allows entity inspection, editor visualistaions etc */
export class GameEditor extends BabylonBurstClient {

    override async setupScene(): Promise<void> {
        await super.setupScene();
        //Create higherarchy HTML that we can use to check various things
        const editorHigherarchy=new PlayHigherarchyHTML();
        editorHigherarchy.SetupPlayHigherarchy(this);
    }
}