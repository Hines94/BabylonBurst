import { Component } from "../EntitySystem/Component";
import { EntTransform, EntVector4 } from "../EntitySystem/CoreComponents";
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

    @Saved(EntVector4,{comment:'Automatically updated for each instance'})
    currentColor = new EntVector4(1,1,1,1);
}

@RegisteredType(SkeletalAnimationSpecifier,{RequiredComponents:[EntTransform],comment:'Specify an animation to play during the skeletal animation'})
export class SkeletalAnimationSpecifier extends Component {
    @Saved(String)
    AnimationName = '';
    @Saved(Boolean)
    Loop = false;
    @Saved(Number)
    playRate = 1;
    @Saved(Boolean)
    bRandomOffsetFrame = true;
    frameOffset = 0;
}

@RegisteredType(InstancedSkeletalRender,{RequiredComponents:[EntTransform,SkeletalAnimationSpecifier],comment:`Used to display a visual mesh on an Entity. Use animation controller to show desired anim.`})
export class InstancedSkeletalRender extends InstancedRender {

}

@RegisteredType(HiddenEntity,{comment:`Use this to easily and quickly prevent an entity from being rendered`})
/** Set this for an easy way to avoid rendering an entity */
export class HiddenEntity extends Component {

}