import { Component } from "../EntitySystem/Component";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { ModelSpecifier } from "../Rendering/ModelSpecifier";


@RegisteredType(NavigationSurface,{comment:`A surface that will be built into navigation layer geometry`})
export class NavigationSurface extends Component {

    @TrackedVariable()
    @Saved(String,{comment:"Layers that this surface will be built for. Eg Land/Sea. default is the Default."})
    NavigationLayers = ["default"];

    @TrackedVariable()
    @Saved(ModelSpecifier,{comment:"Model that is added to the geometry for the navmesh"})
    SurfaceModel = new ModelSpecifier();
    
}
