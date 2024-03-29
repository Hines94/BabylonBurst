import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { EntTransform, EntVector3 } from "../EntitySystem/CoreComponents";
import { GetSavedPhysicsMeshes, PhysicsItem } from "./PhysicsItem";
import { Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, Quaternion, Vector3 } from "@babylonjs/core";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";

/** Num decimal places for the box size */
const boxSizeDP = 2;

@RegisteredType(PhysicsBoxComponent,{ comment:"A physics box that will be a collider"})
export class PhysicsBoxComponent extends PhysicsItem {

    @Saved(EntVector3,{comment:"Size of the physics box"})
    physicsBoxSize = new EntVector3(1,1,1);

    isValidItem(): Boolean {
        return this.physicsBoxSize.X > 0 && this.physicsBoxSize.Y > 0 && this.physicsBoxSize.Z > 0;
    }

    GetPhysicsMeshName(): string {
        return "PhysicsBoxMesh_" + this.triggerOnly + "_" + this.physicsBoxSize.X.toFixed(boxSizeDP) + "_" + 
        this.physicsBoxSize.Y.toFixed(boxSizeDP) + "_" + this.physicsBoxSize.Z.toFixed(boxSizeDP);
    }

    override async GetPhysicsMesh(): Promise<Mesh> {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem);
        const boxMeshName = this.GetPhysicsMeshName();

        // Generate box for correct size
        const mesh = MeshBuilder.CreateBox(boxMeshName,{width:this.physicsBoxSize.X,height:this.physicsBoxSize.Y,depth:this.physicsBoxSize.Z}, ecosystem.scene);
        return mesh
    }

    generatePhysicsBody(ecosystem: GameEcosystem, generatedMesh: Mesh): PhysicsBody {
        var boxShape = new PhysicsShapeBox(
            new Vector3(0, 0, 0),
            Quaternion.Identity(),
            new Vector3(this.physicsBoxSize.X, this.physicsBoxSize.Y, this.physicsBoxSize.Z),
            ecosystem.scene
        );
        boxShape.isTrigger = this.triggerOnly;
        const physicsBody = new PhysicsBody(generatedMesh,PhysicsMotionType.DYNAMIC,false,ecosystem.scene);
        physicsBody.shape = boxShape;
        return physicsBody;
    }
}