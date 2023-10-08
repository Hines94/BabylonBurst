import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { hideColliderVisualSystem } from "@BabylonBurstClient/Rendering/ColliderVisualRenderSystem";
import { RefreshNavmeshVisualisationStage, navStageChangeDat, onContoursRebuild, onNavmeshStageChange } from "@BabylonBurstClient/Rendering/NavmeshVisualRenderSystem";
import { AddOptionToEditorTopMenu, GenerateTopMenuToggle } from "../../Utils/EditorTopMenu";
import { RefreshWireframeMode } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
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
    GenerateTopMenuToggle(ecosystem,"Show Editor Light", "View","",
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
    GenerateTopMenuToggle(ecosystem,"Show Collider", "View","",
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
    GenerateTopMenuToggle(ecosystem,"Show Wireframe", "View","Meshes/",
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
    GenerateTopMenuToggle(data.ecosystem,"Show " + data.stage, "View","Navigation/",
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