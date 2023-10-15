import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { GenerateTopMenuToggle } from "../../Utils/EditorTopMenu";


export class EditorDebugOptions {
    bContentBrowserOption = true;
    bHigherarchyOption = true;
    bInspectorOption = true;
}

export function SetupAllEditorDebugOptions(ecosystem: GameEcosystem, options:Partial<EditorDebugOptions>) {
    const debugOptions = new EditorDebugOptions();
    Object.assign(debugOptions,options);

    const contentBrowser =  ecosystem.doc.getElementById("ContentBrowser") as HTMLElement;
    if(debugOptions.bContentBrowserOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Content Browser", "Debug","",
        (ecosystem:GameEcosystem)=>{
            contentBrowser.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            contentBrowser.classList.add("hidden");
        })
    } else {
        //Just hide
        contentBrowser.classList.add("hidden");
    }

    const Higherarchy =  ecosystem.doc.getElementById("Higherarchy") as HTMLElement;
    if(debugOptions.bHigherarchyOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Entity Higherarchy", "Debug","",
        (ecosystem:GameEcosystem)=>{
            Higherarchy.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            Higherarchy.classList.add("hidden");
        })
    } else {
        //Just hide
        Higherarchy.classList.add("hidden");
    }

    const Inspector =  ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
    if(debugOptions.bInspectorOption) {
        //Provide option for hide/show
        GenerateTopMenuToggle(ecosystem,"Entity Inspector", "Debug","",
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.add("hidden");
        })
    } else {
        //Just hide
        Inspector.classList.add("hidden");
    }
}