import { BabylonBurstClient } from "@BabylonBurstClient/BabylonBurstClient"
import { PlayHigherarchyHTML } from "./HTML/Higherarchy/PlayHigherarchyHTML";
import { ShowToastError, ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";


/** Special version of the game client that allows entity inspection, editor visualistaions etc */
export class GameEditor extends BabylonBurstClient {
    isEditor = true;
    
    DisplayErrorIfEditor = (message: string) =>{ 
        ShowToastError(message,this.doc);
    }
    DisplayMessageIfEditor = (message: string) => {
        ShowToastNotification(message,3000,this.doc);
    }
    DisplayError = (message: string) => {
        ShowToastError(message,this.doc);
    }

    override async setupScene(): Promise<void> {
        await super.setupScene();
        //Create higherarchy HTML that we can use to check various things
        const editorHigherarchy=new PlayHigherarchyHTML();
        editorHigherarchy.SetupPlayHigherarchy(this);
    }
}