import { GameEcosystem } from "@engine/GameEcosystem";
import { EditorBuildOptions, SetupAllEditorBuildOptions } from "./BuildOptionUtils";
import { SetupAllEditorVisualisations } from "./VisualAidUtils";
import { EditorDebugOptions, SetupAllEditorDebugOptions } from "./DebugOptionUtils";


export function SetupAllTopBarOptions(ecosystem:GameEcosystem, buildOptions:Partial<EditorBuildOptions>,debugOptions:Partial<EditorDebugOptions>) {
    SetupAllEditorBuildOptions(ecosystem,buildOptions);
    SetupAllEditorVisualisations(ecosystem);
    SetupAllEditorDebugOptions(ecosystem,debugOptions);
}