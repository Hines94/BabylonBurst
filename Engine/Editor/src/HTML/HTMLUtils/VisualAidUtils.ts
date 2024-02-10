import { GenerateTopMenuToggle, viewItemPriority } from "../../Utils/EditorTopMenu";
import { RefreshWireframeMode } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { Color4, HemisphericLight, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { GridFloorOverlay } from "@BabylonBurstClient/Environment/GridFloorOverlay";
import { AngleToRad } from "@BabylonBurstCore/Utils/MathUtils";
import { NavigationLayer } from "@BabylonBurstCore/Navigation/NavigationLayer";
import { ShowAgentViz } from "@BabylonBurstCore/Navigation/NavAgentVisualistaionSystem";
import { PhysicsMeshComponent } from "@BabylonBurstCore/Physics/PhysicsMesh";
import { HiddenEntity } from "@BabylonBurstCore/Rendering/InstancedRender";

export class EditorVisOptions {
    bShowNavmeshByDefault = true;
}

/** All visualistaion options such as view colliders etc */
export async function SetupAllEditorVisualisations(ecosystem: GameEcosystem, options: Partial<EditorVisOptions>) {
    const spawnoptions = new EditorVisOptions();
    Object.assign(spawnoptions, options);
    await ecosystem.waitLoadedPromise;
    SetupWiremeshVisualistaion(ecosystem);
    SetupNavmeshVisualisation(ecosystem, spawnoptions);
    SetupNavAgentVisualisation(ecosystem, spawnoptions);
    SetupEditorDownLight(ecosystem);
    SetupEditorGridFloor(ecosystem);
    SetupPhysicsVisualistaion(ecosystem);
}

function SetupEditorDownLight(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties["___EDITORPOWERLIGHT___"]) {
        return;
    }
    //Create light
    var light = new HemisphericLight("editorDownLight", new Vector3(-1, 1, 0), ecosystem.scene);
    ecosystem.dynamicProperties["___EDITORPOWERLIGHT___"] = light;
    light.setEnabled(false);
    GenerateTopMenuToggle(
        ecosystem,
        "Show Editor Light",
        "View",
        "",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            //On callback
            light.setEnabled(true);
        },
        (ecosystem: GameEcosystem) => {
            //Off callback
            light.setEnabled(false);
        },
    );
}

function SetupEditorGridFloor(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties["___EDITORGRIDFLOOR___"]) {
        return;
    }
    //Create light
    const gridfloor = new GridFloorOverlay(ecosystem.scene, {
        gridWidthX: 30,
        gridWidthY: 30,
        gridTileSize: 0.5,
        tileMargin: 0.05,
        gridColor: new Color4(0.1, 0.1, 0.1, 0.01),
    });
    gridfloor.moveableNode.rotation = new Vector3(AngleToRad(90), 0, 0);
    ecosystem.dynamicProperties["___EDITORGRIDFLOOR___"] = gridfloor;
    GenerateTopMenuToggle(
        ecosystem,
        "Show Floor Grid",
        "View",
        "",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            //On callback
            ecosystem.dynamicProperties["___EDITORGRIDFLOOR___"].setVisible(true);
        },
        (ecosystem: GameEcosystem) => {
            //Off callback
            ecosystem.dynamicProperties["___EDITORGRIDFLOOR___"].setVisible(false);
        },
        true,
    );
}

function SetupNavmeshVisualisation(ecosystem: GameEcosystem, options: EditorVisOptions) {
    GenerateTopMenuToggle(
        ecosystem,
        "Show Navmesh",
        "View",
        "",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            //On callback
            ecosystem.dynamicProperties["___DEBUGVISNAVMESH___"] = true;
            NavigationLayer.ShowDebugNavmeshes(true, ecosystem.entitySystem);
        },
        (ecosystem: GameEcosystem) => {
            //Off callback
            ecosystem.dynamicProperties["___DEBUGVISNAVMESH___"] = false;
            NavigationLayer.ShowDebugNavmeshes(false, ecosystem.entitySystem);
        },
        options.bShowNavmeshByDefault,
    );
}

function SetupNavAgentVisualisation(ecosystem: GameEcosystem, options: EditorVisOptions) {
    GenerateTopMenuToggle(
        ecosystem,
        "Show NavAgent Paths",
        "View",
        "",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            //On callback
            ecosystem.dynamicProperties[ShowAgentViz] = true;
        },
        (ecosystem: GameEcosystem) => {
            //Off callback
            ecosystem.dynamicProperties[ShowAgentViz] = false;
        },
        options.bShowNavmeshByDefault,
    );
}

function SetupWiremeshVisualistaion(ecosystem: GameEcosystem) {
    GenerateTopMenuToggle(
        ecosystem,
        "Show Wireframe",
        "View",
        "Meshes/",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            ecosystem.dynamicProperties["___MATERIALWIREFRAMEMODE___"] = true;
            //On callback
            RefreshWireframeMode(ecosystem);
        },
        (ecosystem: GameEcosystem) => {
            ecosystem.dynamicProperties["___MATERIALWIREFRAMEMODE___"] = false;
            //On callback
            RefreshWireframeMode(ecosystem);
        },
    );
}

function SetupPhysicsVisualistaion(ecosystem: GameEcosystem) {
    GenerateTopMenuToggle(
        ecosystem,
        "Show Physics",
        "View",
        "Physics",
        viewItemPriority,
        (ecosystem: GameEcosystem) => {
            ecosystem.dynamicProperties["___PHYSICSDEBUGMODE___"] = true;
            ecosystem.entitySystem.GetEntitiesWithData([PhysicsMeshComponent], [HiddenEntity]).iterateEntities(e => {
                if (
                    e.GetComponent(PhysicsMeshComponent).physicsMesh &&
                    e.GetComponent(PhysicsMeshComponent).physicsMesh.cloneMesh
                ) {
                    e.GetComponent(PhysicsMeshComponent).physicsMesh.cloneMesh.isVisible = true;
                }
            });
        },
        (ecosystem: GameEcosystem) => {
            ecosystem.dynamicProperties["___PHYSICSDEBUGMODE___"] = false;
            ecosystem.entitySystem.GetEntitiesWithData([PhysicsMeshComponent], [HiddenEntity]).iterateEntities(e => {
                if (
                    e.GetComponent(PhysicsMeshComponent).physicsMesh &&
                    e.GetComponent(PhysicsMeshComponent).physicsMesh.cloneMesh
                ) {
                    e.GetComponent(PhysicsMeshComponent).physicsMesh.cloneMesh.isVisible = false;
                }
            });
        },
    );
}
