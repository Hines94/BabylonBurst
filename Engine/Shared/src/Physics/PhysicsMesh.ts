import { Material, Matrix, Mesh, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeMesh, PhysicsShapeType, StandardMaterial } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { ModelSpecifier } from "../Rendering/ModelSpecifier";
import { InstancedRender } from "../Rendering/InstancedRender";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { EntTransform, EntVector3, EntVector4 } from "../EntitySystem/CoreComponents";
import { AsyncStaticMeshDefinition, StaticMeshCloneDetails } from "../AsyncAssets";
import { GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { defaultLayerMask } from "../../../Client/src/Utils/LayerMasks";

@RegisteredType(PhysicsStaticMesh,{ RequiredComponents:[EntTransform], bEditorAddable:false, bEditorRemovable:false, comment:"A static physics mesh that is built not to move"})
export class PhysicsStaticMesh extends Component {

}

var physicsMeshWireframeMat:Material;

@RegisteredType(PhysicsMeshComponent,{ comment:"A physics mesh that will be a collider in the world"})
export class PhysicsMeshComponent extends Component {
    
    @TrackedVariable()
    @Saved(PhysicsMotionType,{comment:"If this mesh is static or dynamic"})
    MotionType = PhysicsMotionType.STATIC;

    @TrackedVariable()
    @Saved(Number,{comment:"The mass of this physics mesh"})
    mass = 100;

    @TrackedVariable()
    @Saved(ModelSpecifier,{comment:"The model to use for this physics object"})
    model = new ModelSpecifier();

    //Current instance of this physics object
    physicsInstanceNumber = -1;

    physicsMesh:StaticMeshCloneDetails;

    onComponentChanged(): void {

        //Set static tag
        if(this.MotionType === PhysicsMotionType.STATIC) {
            if(!this.entityOwner.GetComponent(PhysicsStaticMesh)) {
                (this.entityOwner.owningSystem as EntitySystem).AddSetComponentToEntity(this.entityOwner,new PhysicsStaticMesh());
            }
        } else {
            if(this.entityOwner.GetComponent(PhysicsStaticMesh)) {
                (this.entityOwner.owningSystem as EntitySystem).RemoveComponent(this.entityOwner,PhysicsStaticMesh);
            }
        }

        //Removed?
        if(!this.model.FilePath || !this.model.MeshName) {
            if(this.physicsMesh) {
                this.physicsMesh.cloneMesh.thinInstanceCount--;
                //TODO: update all other meshes to reflect new instance numbers?
                this.physicsMesh = undefined;
                this.physicsInstanceNumber = -1;
                return;
            }
        }

        this.LoadMeshIn();
    }

    async LoadMeshIn() {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem);
        //Create physics mesh
        var meshName: string = this.model.FilePath + "_" + this.model.MeshName;
        var meshes = ecosystem.dynamicProperties["___PHYSICSMESHES___"];

        //Load in mesh?
        if(!meshes[meshName]) {
            const meshDef = new AsyncStaticMeshDefinition(this.model.FilePath,this.model.MeshName,[null],this.model.FileName,defaultLayerMask)
            meshDef.bNoFailMaterialDiff = true;
            const loadMesh = meshDef.getMeshClone(ecosystem.scene,true);
            await loadMesh.getMeshCreatedPromise();
            meshes[meshName] = loadMesh;
        }
        
        //Unable to load mesh?
        if(!meshes[meshName]) {
            return;
        }

        //Same mesh?
        if(meshes[meshName] === this.physicsMesh) {
            this.updateMeshProperties();
            return;
        }

        //Just check mesh is same as when we started loading
        if(meshName !== this.model.FilePath + "_" + this.model.MeshName) {
            return;
        }

        const ourMesh = meshes[meshName] as StaticMeshCloneDetails;
        if(!ourMesh.cloneMesh){
            return;
        }

        //Create a new instance for this entity
        var body = new PhysicsBody(ourMesh.cloneMesh, PhysicsMotionType.STATIC, false, ecosystem.scene);
        body.shape = new PhysicsShapeMesh(
            ourMesh.cloneMesh, 
            ecosystem.scene 
        );
        body.setMassProperties({mass: 1});
        this.physicsMesh = ourMesh;
        const positionMatrix = EntTransform.getAsInstanceTransform(this.entityOwner.GetComponent(EntTransform)).getMatrix();
        this.physicsInstanceNumber = ourMesh.cloneMesh.thinInstanceCount;
        ourMesh.cloneMesh.thinInstanceAdd(positionMatrix);

        if(!physicsMeshWireframeMat) {
            physicsMeshWireframeMat = new StandardMaterial("PhysicsWireframeMat",ecosystem.scene);
            physicsMeshWireframeMat.wireframe = true;
        }

        ourMesh.cloneMesh.material = physicsMeshWireframeMat;
        if(!ecosystem.dynamicProperties["___PHYSICSDEBUGMODE___"]) {
            ourMesh.cloneMesh.isVisible = false;
        }

        this.updateMeshProperties();
    }

    updateMeshProperties() {
        if(!this.physicsMesh || !this.physicsMesh.cloneMesh || this.physicsInstanceNumber === -1) {
            return;
        }
        this.physicsMesh.cloneMesh.physicsBody.setMassProperties({},this.physicsInstanceNumber);
        const transform = this.entityOwner.GetComponent(EntTransform);
        this.physicsMesh.cloneMesh.physicsBody.setTargetTransform(EntVector3.GetVector3(transform.Position),EntVector4.GetQuaternion(transform.Rotation),this.physicsInstanceNumber);
        this.physicsMesh.cloneMesh.physicsBody.setMotionType(this.MotionType,this.physicsInstanceNumber);
        this.physicsMesh.cloneMesh.thinInstanceSetMatrixAt(this.physicsInstanceNumber,EntTransform.getAsInstanceTransform(this.entityOwner.GetComponent(EntTransform)).getMatrix());
    }
}