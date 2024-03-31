import { Mesh, PhysicsBody, PhysicsMotionType, PhysicsShapeMesh } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { ModelSpecifier } from "../Rendering/ModelSpecifier";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { AsyncStaticMeshDefinition } from "../AsyncAssets";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { defaultLayerMask } from "../../../Client/src/Utils/LayerMasks";
import { PhysicsItem } from "./PhysicsItem";

@RegisteredType(PhysicsStaticMesh,{ RequiredComponents:[EntTransform], bEditorAddable:false, bEditorRemovable:false, comment:"A static physics mesh that is built not to move"})
export class PhysicsStaticMesh extends Component {

}

@RegisteredType(PhysicsMeshComponent,{ comment:"A physics mesh that will be a collider in the world"})
export class PhysicsMeshComponent extends PhysicsItem {

    @TrackedVariable()
    @Saved(ModelSpecifier,{comment:"The model to use for this physics object"})
    model = new ModelSpecifier();

    isValidItem(): Boolean {
        return !this.model.FilePath || !this.model.MeshName;
    }

    GetPhysicsMeshName(): string {
        return this.triggerOnly + "_" + this.model.FilePath + "_" + this.model.MeshName;
    }

    override async GetPhysicsMesh(): Promise<Mesh> {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem);
        
        if(!ecosystem.dynamicProperties["____LOADINGPHYSICSMESHES____"]){ecosystem.dynamicProperties["____LOADINGPHYSICSMESHES____"] = {};}
        const loadingMeshes = ecosystem.dynamicProperties["____LOADINGPHYSICSMESHES____"];

        var meshName: string = this.GetPhysicsMeshName();

        // Already existing?
        if(loadingMeshes[meshName]) {
            await loadingMeshes[meshName].getMeshCreatedPromise();
            return loadingMeshes[meshName].cloneMesh;
        }

        //Create physics mesh
        const meshDef = new AsyncStaticMeshDefinition(this.model.FilePath,this.model.MeshName,[null],this.model.FileName,defaultLayerMask)
        meshDef.bNoFailMaterialDiff = true;

        const loadMesh = meshDef.getMeshClone(ecosystem.scene,true);
        loadingMeshes[meshName] = loadMesh;
        await loadMesh.getMeshCreatedPromise();

        //Just check mesh is same as when we started loading
        if(meshName !== this.GetPhysicsMeshName()) {
            return undefined;
        }

        return loadMesh.cloneMesh;
    }

    generatePhysicsBody(ecosystem: GameEcosystem, generatedMesh: Mesh): PhysicsBody {
        var body = new PhysicsBody(generatedMesh, PhysicsMotionType.STATIC, false, ecosystem.scene);
        body.shape = new PhysicsShapeMesh(
            generatedMesh, 
            ecosystem.scene 
        );
        body.shape.isTrigger = this.triggerOnly;
        body.setMassProperties({mass: 1});
        return body;
    }

}