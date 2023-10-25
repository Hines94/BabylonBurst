import { GameEcosystem } from "@engine/GameEcosystem";
import { EditorBuildOptions, SetupAllEditorBuildOptions } from "./BuildOptionUtils";
import { EditorVisOptions, SetupAllEditorVisualisations } from "./VisualAidUtils";
import { EditorDebugOptions, SetupAllEditorDebugOptions } from "./DebugOptionUtils";


export function SetupAllTopBarOptions(ecosystem:GameEcosystem, buildOptions:Partial<EditorBuildOptions>, visOptions:Partial<EditorVisOptions>,debugOptions:Partial<EditorDebugOptions>) {
    SetupAllEditorBuildOptions(ecosystem,buildOptions);
    SetupAllEditorVisualisations(ecosystem,visOptions);
    SetupAllEditorDebugOptions(ecosystem,debugOptions);
}