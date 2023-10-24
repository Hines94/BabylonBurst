import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateTopMenuButton, buildMenuPriority } from "../../Utils/EditorTopMenu";
import { RebuildAllNavmeshLayers } from "@engine/Navigation/NavigationBuildSystem"

export class EditorBuildOptions {
    /** Option to rebuild all navmeshes with click */
    bAllowNavigationRebuild = true;
}

export function SetupAllEditorBuildOptions(ecosystem: GameEcosystem, options:Partial<EditorBuildOptions>) {

    const buildOptions = new EditorBuildOptions();
    Object.assign(buildOptions,options);

    if(buildOptions.bAllowNavigationRebuild) {
        //Provide option for hide/show
        GenerateTopMenuButton(ecosystem,"Rebuild Navmesh", "Build","",buildMenuPriority,
        (ecosystem:GameEcosystem)=>{
            RebuildAllNavmeshLayers(ecosystem)
        })
    }
}