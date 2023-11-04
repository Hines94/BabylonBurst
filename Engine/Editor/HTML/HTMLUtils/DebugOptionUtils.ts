import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateTopMenuToggle, debugOptionPriority } from "../../Utils/EditorTopMenu";
import { FramerateCounter } from "@BabylonBurstClient/GUI/Generic/FramerateCounter";


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
        const higherarchyRefresh = GenerateTopMenuToggle(ecosystem,"Entity Higherarchy", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            if((Higherarchy as any).OwningHigherarchElement) {
                (Higherarchy as any).OwningHigherarchElement.ShowHigherarchy();
            } else {
                Higherarchy.classList.remove("hidden");
            }
        },
        (ecosystem:GameEcosystem)=>{
            Higherarchy.classList.add("hidden");
        },debugOptions.bDefaultHigherarchy)

        const higherarchCallback = ()=>{
            const visible = !Higherarchy.classList.contains("hidden");
            if(visible !== ecosystem.dynamicProperties[higherarchyRefresh.propName]) {
                ecosystem.dynamicProperties[higherarchyRefresh.propName] = visible;
                higherarchyRefresh.refreshCallback();
            }
        };
        const observer = new MutationObserver(higherarchCallback);
        observer.observe(Higherarchy, {
            attributes: true, // listen for attribute changes
            attributeFilter: ['class'] // only listen to class changes
        });

    } else {
        //Just hide
        if((Higherarchy as any).OwningHigherarchElement) {
            (Higherarchy as any).OwningHigherarchElement.HideHigherarchy();
        } else {
            Higherarchy.classList.add("hidden");
        }
    }

    const Inspector =  ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
    if(debugOptions.bInspectorOption) {
        //Provide option for hide/show
        const inspectorRefresh = GenerateTopMenuToggle(ecosystem,"Entity Inspector", "Debug","",debugOptionPriority,
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.remove("hidden");
        },
        (ecosystem:GameEcosystem)=>{
            Inspector.classList.add("hidden");
        },debugOptions.bDefaultInspector)

        const inspectCallback = ()=>{
            const visible = !Inspector.classList.contains("hidden");
            if(visible !== ecosystem.dynamicProperties[inspectorRefresh.propName]) {
                ecosystem.dynamicProperties[inspectorRefresh.propName] = visible;
                inspectorRefresh.refreshCallback();
            }
        };
        const observer = new MutationObserver(inspectCallback);
        observer.observe(Inspector, {
            attributes: true, // listen for attribute changes
            attributeFilter: ['class'] // only listen to class changes
        });
    } else {
        //Just hide
        Inspector.classList.add("hidden");
    }

    if(debugOptions.bFramerateOption && !ecosystem.dynamicProperties["___FRAMERATE___"]) { 
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