import { Component } from "../EntitySystem/Component";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType(ModelSpecifier)
export class ModelSpecifier {
    @Saved(String)
    FilePath:string;
    @Saved(String)
    FileName:string;
    @Saved(String)
    MeshName:string;
}

@RegisteredType(MaterialSpecifier)
export class MaterialSpecifier {
    @Saved(String)
    FilePath:string;
    @Saved(String)
    FileName:string;
}

@RegisteredType(InstancedRender,{RequiredComponents:[EntTransform]})
export class InstancedRender extends Component {
    @Saved(ModelSpecifier)
    ModelData:ModelSpecifier = new ModelSpecifier();

    @Saved(MaterialSpecifier)
    MaterialData:MaterialSpecifier[] = [];
    
    @Saved(Number)
    LayerMask:number = 0;
}

@RegisteredType(HiddenEntity)
/** Set this for an easy way to avoid rendering an entity */
export class HiddenEntity extends Component {

}