import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";
import { hideColliderVisualSystem } from "@BabylonBoostClient/Rendering/ColliderVisualRenderSystem";
import { RefreshNavmeshVisualisationStage, navStageChangeDat, onNavmeshStageChange } from "@BabylonBoostClient/Rendering/NavmeshVisualRenderSystem";
import { AddOptionToEditorTopMenu } from "../../Utils/EditorTopMenu";

/** All visualistaion options such as view colliders etc */
export function SetupAllEditorVisualisations(ecosystem: GameEcosystem) {
    SetupColliderVisualisation(ecosystem);
    onNavmeshStageChange.add(GenerateNavStageVisualistaion);
    GenerateNavStageVisualistaion({ecosystem:ecosystem,stage:"Contours"})
}

function SetupColliderVisualisation(ecosystem: GameEcosystem) {
    GenerateEcosystemDropdownProp(ecosystem,"Collider","",
        (ecosystem:GameEcosystem)=>{
            //On callback
        },
        (ecosystem:GameEcosystem)=>{
            //Off callback
            hideColliderVisualSystem(ecosystem);
        }
    )
}

export function GenerateNavStageVisualistaion(data:navStageChangeDat) {
    GenerateEcosystemDropdownProp(data.ecosystem,data.stage,"Navigation/",
        (ecosystem:GameEcosystem)=>{
            //On
            RefreshNavmeshVisualisationStage(ecosystem,data.stage);
        },
        (ecosystem:GameEcosystem)=>{
            //Off callback
            RefreshNavmeshVisualisationStage(ecosystem,data.stage);
        },
        true
    )
}

function GenerateEcosystemDropdownProp(ecosystem:GameEcosystem,name:string, subfolders:string, onCallback:(system:GameEcosystem)=>void, offCallback:(system:GameEcosystem)=>void, bDefaultOn = false) {
    const propName = "___" + name + "___";
    const indicatorName = propName+"___INDICATOR___";
    if(ecosystem.dynamicProperties[indicatorName]) {
        return;
    }
    const ddOption = AddOptionToEditorTopMenu(ecosystem, "View", subfolders + name);
    ecosystem.dynamicProperties[indicatorName] = ddOption;
    ddOption.addEventListener("click", () => {
        if (ecosystem.dynamicProperties[propName]) {
            ecosystem.dynamicProperties[propName] = false;
        } else {
            ecosystem.dynamicProperties[propName] = true;
        }
        RefreshEcosystemDropdownProp(ecosystem,name,onCallback,offCallback);
    });
    if(bDefaultOn) {
        ecosystem.dynamicProperties[propName] = true;
        RefreshEcosystemDropdownProp(ecosystem,name,onCallback,offCallback);
    }
}

function RefreshEcosystemDropdownProp(ecosystem:GameEcosystem,name:string, onCallback:(system:GameEcosystem)=>void, offCallback:(system:GameEcosystem)=>void) {
    const propName = "___" + name + "___";
    const indicator = ecosystem.dynamicProperties[propName+"___INDICATOR___"];
    if (ecosystem.dynamicProperties[propName]) {
        indicator.innerHTML = "Show " + name + " &#10003";
        onCallback(ecosystem);
    } else {
        indicator.innerHTML = "Show " + name;
        offCallback(ecosystem);
    }
}

