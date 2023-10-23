import { Component } from "../EntitySystem/Component";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { ModelSpecifier } from "../Rendering/ModelSpecifier";


@RegisteredType(NavigationSurface)
export class NavigationSurface extends Component {

    @TrackedVariable()
    @Saved(String)
    NavigationLayers = ["default"];

    @TrackedVariable()
    @Saved(ModelSpecifier)
    SurfaceModel = new ModelSpecifier();
    
}
