import { DirectionalLight } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntVector3 } from "../EntitySystem/CoreComponents";
import { EntityData } from "../EntitySystem/EntityData";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { GameEcosystem } from "../GameEcosystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";



@RegisteredType(DirectionalLightComp)
export class DirectionalLightComp extends Component {
    @Saved(EntVector3)
    @TrackedVariable()
    Position:EntVector3;

    @TrackedVariable()
    @Saved(EntVector3)
    Direction = new EntVector3(0,-1,0);

    @TrackedVariable()
    @Saved(Number)
    Intensity = 1;

    createdLight:DirectionalLight;

    onComponentRemoved(entData: EntityData): void {
        if(this.createdLight !== undefined) {
            this.createdLight.dispose();
        }
    }

    rebuildLight(entity:EntityData,ecosystem:GameEcosystem) {
        if(!this.createdLight) {
            this.createdLight = new DirectionalLight(`DirLight_${entity.EntityId}`,EntVector3.GetVector3(this.Direction),ecosystem.scene);
        }
        this.createdLight.position = EntVector3.GetVector3(this.Position);
        this.createdLight.direction = EntVector3.GetVector3(this.Direction);
        this.createdLight.intensity = this.Intensity;
    }
    
}