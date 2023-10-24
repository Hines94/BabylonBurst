import { Component } from "../EntitySystem/Component";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { MaterialSpecifier } from "./MaterialSpecifier";
import { ModelSpecifier } from "./ModelSpecifier";

@RegisteredType(InstancedRender,{RequiredComponents:[EntTransform],comment:`Used to display a visual mesh on an Entity`})
export class InstancedRender extends Component {
    @Saved(ModelSpecifier,{comment:`Which model should be used to render? Warning - Changing names/paths of files will break this!`})
    ModelData:ModelSpecifier = new ModelSpecifier();

    @Saved(MaterialSpecifier,{comment:`Which materials should be used to render? Warning - Changing names/paths of files will break this!`})
    MaterialData:MaterialSpecifier[] = [];
    
    @Saved(Number,{comment:`Use different layers (eg 1,2,3) to give preference in rendering. Leave as 0 for default.`})
    LayerMask:number = 0;
}

@RegisteredType(HiddenEntity,{comment:`Use this to easily and quickly prevent an entity from being rendered`})
/** Set this for an easy way to avoid rendering an entity */
export class HiddenEntity extends Component {

}