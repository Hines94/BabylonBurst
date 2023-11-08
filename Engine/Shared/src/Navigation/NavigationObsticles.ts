import { IObstacle } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntTransform, EntVector3, EntVector4 } from "../EntitySystem/CoreComponents";
import { EntityData } from "../EntitySystem/EntityData";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { NavigationLayer } from "./NavigationLayer";

@RegisteredType(NavigationBoxObsticle,{RequiredComponents:[EntTransform], comment:"Will automatically place this box obsticle where our Transform positon is"})
export class NavigationBoxObsticle extends Component {

    @TrackedVariable()
    @Saved(String)
    targetNavigationLayer = "default";

    @TrackedVariable()
    @Saved(Boolean,{comment:"Set to false to disable this obsticle"})
    isEnabled = true;
    
    @TrackedVariable()
    @Saved(EntVector3,{comment:"Total size of the box obsticle"})
    boxExtents = new EntVector3(1,1,1);

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
        if(layer === undefined) {
            if(this.builtLayer === undefined) {
                return;
            }
        } else {
            this.builtLayer = layer;
        }

        const pos = EntVector3.GetVector3(transform.Position);
        const extents = EntVector3.GetVector3(EntVector3.Multiply(transform.Scale,this.boxExtents));
        const angle = EntVector4.QuaternionToEuler(transform.Rotation).Y;
        this.ourObsticle = this.builtLayer.navLayerPlugin.addBoxObstacle(pos,extents,angle);
    }

    ClearObsticle() {
        if(this.builtLayer === undefined || this.ourObsticle === undefined) {
            return;
        }
        this.builtLayer.navLayerPlugin.removeObstacle(this.ourObsticle);
    }
}