import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType
export class ModelSpecifier {
    @Saved()
    FilePath:string;
    @Saved()
    FileName:string;
    @Saved()
    MeshName:string;
}
@RegisteredType
export class MaterialSpecifier {
    @Saved()
    FilePath:string;
    @Saved()
    FileName:string;
}


@RegisteredType
export class InstancedRender extends Component {
    @Saved()
    ModelData:ModelSpecifier = new ModelSpecifier();

    @Saved(MaterialSpecifier)
    MaterialData:MaterialSpecifier[] = [];
    
    @Saved()
    LayerMask:number = 0;
}

@RegisteredType
/** Set this for an easy way to avoid rendering an entity */
export class HiddenEntity extends Component {

}