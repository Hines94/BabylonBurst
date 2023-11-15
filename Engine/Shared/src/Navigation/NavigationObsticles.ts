import { IObstacle } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntTransform, EntVector3, EntVector4 } from "../EntitySystem/CoreComponents";
import { EntityData } from "../EntitySystem/EntityData";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { NavigationLayer } from "./NavigationLayer";

//Parent class with common functions for all shapes
@RegisteredType(NavigationObsticle)
export abstract class NavigationObsticle extends Component {

    @TrackedVariable()
    @Saved(String)
    targetNavigationLayer = "default";

    @TrackedVariable()
    @Saved(Boolean,{comment:"Set to false to disable this obsticle"})
    isEnabled = true;

    ourObsticle:IObstacle;
    builtLayer:NavigationLayer;

    RebuildObsticle(entity:EntityData,layer:NavigationLayer) {
        const transform = entity.GetComponent(EntTransform);
        if(!transform) {
            this.ClearObsticle();
            return;
        }

        this.ClearObsticle();

        if(entity === undefined) {
            return;
        }
        if(layer === undefined || layer.navLayerPlugin === undefined) {
            return;
        } else {
            this.builtLayer = layer;
        }
        this.ourObsticle = this.buildSpecificObsticle(entity,layer,transform);
    }

    ClearObsticle() {
        if(this.builtLayer === undefined || this.ourObsticle === undefined) {
            return;
        }
        this.builtLayer.navLayerPlugin.removeObstacle(this.ourObsticle);
    }

    protected abstract buildSpecificObsticle(entity:EntityData,layer:NavigationLayer, transform:EntTransform):IObstacle;
}


@RegisteredType(NavigationBoxObsticle,{RequiredComponents:[EntTransform], comment:"Will automatically place this box obsticle where our Transform positon is"})
export class NavigationBoxObsticle extends NavigationObsticle {
    
    @TrackedVariable()
    @Saved(EntVector3,{comment:"Total size of the box obsticle"})
    boxExtents = new EntVector3(1,1,1);


    buildSpecificObsticle(entity:EntityData,layer:NavigationLayer, transform:EntTransform) : IObstacle{
        const pos = EntVector3.GetVector3(transform.Position);
        const extents = EntVector3.GetVector3(EntVector3.Multiply(transform.Scale,this.boxExtents));
        const angle = EntVector4.QuaternionToEuler(transform.Rotation).Y;
        return this.builtLayer.navLayerPlugin.addBoxObstacle(pos,extents,angle);
    }
}