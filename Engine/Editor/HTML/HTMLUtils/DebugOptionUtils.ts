import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateTopMenuToggle } from "../../Utils/EditorTopMenu";
import { FramerateCounter } from "@BabylonBurstClient/GUI/Generic/FramerateCounter";

const debugOptionPriority = 10;


export class EditorDebugOptions {
    bContentBrowserOption = true;
    bDefaultContentBrowser = false;

    bHigherarchyOption = true;
    bDefaultHigherarchy = true;

    bInspectorOption = true;
    bDefaultInspector = false;

    bFramerateOption = true;
}

export function SetupAllEditorDebugOptions(ecosystem: GameEcosystem, options:Partial<EditorDebugOptions>) {
    const debugOptions = new EditorDebugOptions();
    Object.assign(debugOptions,options);

    const contentBrowser =  ecosystem.doc.getElementById("ContentBrowser") as HTMLElement;
    if(debugOptions.bContentBrowserOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Content Browser", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            contentBrowser.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            contentBrowser.classList.add("hidden");
        },debugOptions.bDefaultContentBrowser)
    } else {
        if(contentBrowser) {
            //Just hide
            contentBrowser.classList.add("hidden");
        }
    }

    const Higherarchy =  ecosystem.doc.getElementById("Higherarchy") as HTMLElement;
    if(debugOptions.bHigherarchyOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Entity Higherarchy", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            Higherarchy.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            Higherarchy.classList.add("hidden");
        },debugOptions.bDefaultHigherarchy)
    } else {
        //Just hide
        Higherarchy.classList.add("hidden");
    }

    const Inspector =  ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
    if(debugOptions.bInspectorOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Entity Inspector", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.add("hidden");
        },debugOptions.bDefaultInspector)
    } else {
        //Just hide
        Inspector.classList.add("hidden");
    }

    if(debugOptions.bFramerateOption && !ecosystem.dynamicProperties["___FRAMERATE___"]) { 
        console.log("Creating framerate")
        const fr = new FramerateCounter(ecosystem.doc);
        ecosystem.dynamicProperties["___FRAMERATE___"] = fr;
        ecosystem.onUpdate.add(()=>{fr.updateFramerate(ecosystem.deltaTime);})
        GenerateTopMenuToggle(ecosystem,"Framerate", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            fr.setHidden(false);
        },
        (ecosystem:GameEcosystem)=>{
            fr.setHidden(true);
        },true)
    }
}