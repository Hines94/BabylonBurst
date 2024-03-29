import { Color3, Material, StandardMaterial } from "@babylonjs/core";
import { GameEcosystem } from "../GameEcosystem";

var physicsMeshWireframeMat:StandardMaterial;

export function GetPhysicsWireframeMat(ecosystem:GameEcosystem):Material {
    if(!physicsMeshWireframeMat) {
        physicsMeshWireframeMat = new StandardMaterial("PhysicsWireframeMat",ecosystem.scene);
        physicsMeshWireframeMat.disableLighting = true;
        physicsMeshWireframeMat.wireframe = true;
    }
    return physicsMeshWireframeMat;
}

var physicsTriggerMeshWireframeMat:StandardMaterial;

export function GetPhysicsTriggerWireframeMat(ecosystem:GameEcosystem):Material {
    if(!physicsTriggerMeshWireframeMat) {
        physicsTriggerMeshWireframeMat = new StandardMaterial("PhysicsWireframeMat",ecosystem.scene);
        physicsTriggerMeshWireframeMat.diffuseColor = Color3.Red();
        physicsTriggerMeshWireframeMat.disableLighting = true;
        physicsTriggerMeshWireframeMat.wireframe = true;
    }
    return physicsTriggerMeshWireframeMat;
}
