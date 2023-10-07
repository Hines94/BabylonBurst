import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { hideColliderVisualSystem } from "@BabylonBurstClient/Rendering/ColliderVisualRenderSystem";
import { RefreshNavmeshVisualisationStage, navStageChangeDat, onContoursRebuild, onNavmeshStageChange } from "@BabylonBurstClient/Rendering/NavmeshVisualRenderSystem";
import { AddOptionToEditorTopMenu } from "../../Utils/EditorTopMenu";
import { RefreshWireframeMode } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { HemisphericLight, Vector3 } from "@babylonjs/core";

/** All visualistaion options such as view colliders etc */
export function SetupAllEditorVisualisations(ecosystem: GameEcosystem) {
    SetupNavmeshRebuild(ecosystem)
    SetupWiremeshVisualistaion(ecosystem);
    SetupColliderVisualisation(ecosystem);
    onNavmeshStageChange.add(GenerateNavStageVisualistaion);
    onContoursRebuild.add((eco)=>{
        GenerateNavStageVisualistaion({ecosystem:ecosystem,stage:"Contours"})  
    })
    SetupEditorDownLight(ecosystem);
}


function SetupEditorDownLight(ecosystem:GameEcosystem) {
    if(ecosystem.dynamicProperties["___EDITORPOWERLIGHT___"]) {
        return;
    }
    //Create light
    var light = new HemisphericLight("editorDownLight", new Vector3(-1, 1, 0), ecosystem.scene);
    ecosystem.dynamicProperties["___EDITORPOWERLIGHT___"] = light;
    light.setEnabled(false);
    GenerateEcosystemDropdownProp(ecosystem,"Editor Light","",
    (ecosystem:GameEcosystem)=>{
        //On callback
        light.setEnabled(true);
    },
    (ecosystem:GameEcosystem)=>{
        //Off callback
        light.setEnabled(false);
    }
)
}

function SetupNavmeshRebuild(ecosystem:GameEcosystem) {
    const ddOption = AddOptionToEditorTopMenu(ecosystem, "Build", "Rebuild Nav");
    ddOption.addEventListener("click", () => {
        ecosystem.wasmWrapper.RegenerateNavmesh();
    });
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

function SetupWiremeshVisualistaion(ecosystem:GameEcosystem) {
    GenerateEcosystemDropdownProp(ecosystem,"Wireframe","Meshes/",
    (ecosystem:GameEcosystem)=>{
        ecosystem.dynamicProperties["___MATERIALWIREFRAMEMODE___"] = true;
        //On callback
        RefreshWireframeMode(ecosystem);
    },
    (ecosystem:GameEcosystem)=>{
        ecosystem.dynamicProperties["___MATERIALWIREFRAMEMODE___"] = false;
        //On callback
        RefreshWireframeMode(ecosystem);
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
        }
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
    } else {
        ddOption.innerText = "Show " + name;
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

