import { Material, Matrix, Mesh, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeMesh, PhysicsShapeType, PhysicsViewer, StandardMaterial } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { ModelSpecifier } from "../Rendering/ModelSpecifier";
import { InstancedRender } from "../Rendering/InstancedRender";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { EntTransform, EntVector3, EntVector4 } from "../EntitySystem/CoreComponents";
import { AsyncStaticMeshDefinition, StaticMeshCloneDetails } from "../AsyncAssets";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { defaultLayerMask } from "../../../Client/src/Utils/LayerMasks";
import { GetPhysicsWireframeMat } from "./PhysicsMaterials";

@RegisteredType(PhysicsStaticItem,{ RequiredComponents:[EntTransform], bEditorAddable:false, bEditorRemovable:false, comment:"A static physics item that is built not to move"})
export class PhysicsStaticItem extends Component {

}

/** Generic physics item - could be a box or a specific mesh */
export abstract class PhysicsItem extends Component {
    
    @TrackedVariable()
    @Saved(PhysicsMotionType,{comment:"If this item is static or dynamic"})
    MotionType = PhysicsMotionType.STATIC;

    @TrackedVariable()
    @Saved(Number,{comment:"The mass of this physics item"})
    mass = 100;

    @TrackedVariable()
    @Saved(Boolean,{comment:"Is this a trigger only?"})
    triggerOnly = false;

    //Current instance of this physics item
    physicsInstanceNumber = -1;

    physicsMesh:Mesh;

    abstract isValidItem():Boolean;
    /** Should be overwritten with specific method for getting our mesh (eg box or sphere) including physics body */
    async GetPhysicsMesh():Promise<Mesh>{return undefined;}
    /** Unique name to identify exactly this physics mesh */
    abstract GetPhysicsMeshName():string;

    onComponentChanged(): void {

        //Set static tag
        if(this.MotionType === PhysicsMotionType.STATIC) {
            if(!this.entityOwner.GetComponent(PhysicsStaticItem)) {
                (this.entityOwner.owningSystem as EntitySystem).AddSetComponentToEntity(this.entityOwner,new PhysicsStaticItem());
            }
        } else {
            if(this.entityOwner.GetComponent(PhysicsStaticItem)) {
                (this.entityOwner.owningSystem as EntitySystem).RemoveComponent(this.entityOwner,PhysicsStaticItem);
            }
        }

        //Removed?
        if(!this.isValidItem()) {
            this.removeOldPhysicsMesh();
        }

        this.LoadMeshIn();
    }

    private removeOldPhysicsMesh() {
        if(this.physicsMesh) {
            this.physicsMesh.thinInstanceCount--;
            //TODO: update all other meshes to reflect new instance numbers?
            this.physicsMesh = undefined;
            this.physicsInstanceNumber = -1;
            return;
        }
        this.physicsMesh = undefined;
    }

    async LoadMeshIn() {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem);

        // TODO: What about trigger? Different physics body!

        const savedMeshes = GetSavedPhysicsMeshes(ecosystem);
        const thisMeshName = this.GetPhysicsMeshName();
        var physicMesh:Mesh = savedMeshes[thisMeshName];
        
        if(!physicMesh) {
            physicMesh = await this.GetPhysicsMesh();

            if(!physicMesh) {
                this.removeOldPhysicsMesh();
                return;
            }
            
            physicMesh.isVisible = false;
            physicMesh.layerMask = defaultLayerMask;
            physicMesh.thinInstanceAddSelf(true);
            savedMeshes[thisMeshName] = physicMesh;
            physicMesh.physicsBody = this.generatePhysicsBody(ecosystem,physicMesh);
        }

        if(physicMesh === this.physicsMesh) {
            this.updateMeshProperties();
            return;
        }

        //Create a new instance for this entity
        this.physicsMesh = physicMesh;
        const positionMatrix = EntTransform.getAsInstanceTransform(this.entityOwner.GetComponent(EntTransform)).getMatrix();
        
        // Workaround https://forum.babylonjs.com/t/instanced-physics-static-mesh/49031/4 required at least 1 ahead of time
        if(this.physicsMesh.thinInstanceCount === 1) {
            this.physicsInstanceNumber = 0;
        } else {
            this.physicsInstanceNumber = this.physicsMesh.thinInstanceAdd(positionMatrix);
            this.physicsMesh.physicsBody.updateBodyInstances();
        }

        //Debug properties
        this.physicsMesh.material = GetPhysicsWireframeMat(ecosystem);
        if(ecosystem.dynamicProperties["___PHYSICSDEBUGMODE___"]) {
            this.physicsMesh.isVisible = true;
        }

        this.updateMeshProperties();
    }

    abstract generatePhysicsBody(ecosystem:GameEcosystem, generatedMesh:Mesh):PhysicsBody;

    updateMeshProperties() {
        if(!this.physicsMesh || !this.physicsMesh || this.physicsInstanceNumber === -1) {
            return;
        }
        const transform = this.entityOwner.GetComponent(EntTransform);

        this.physicsMesh.physicsBody.setMassProperties({},this.physicsInstanceNumber);
        this.physicsMesh.thinInstanceSetMatrixAt(this.physicsInstanceNumber,EntTransform.getAsInstanceTransform(transform).getMatrix());
        this.physicsMesh.physicsBody.setMotionType(this.MotionType,this.physicsInstanceNumber);
    }
}

export function GetSavedPhysicsMeshes(ecosystem:GameEcosystem) {
    if(!ecosystem.dynamicProperties["___PHYSICSMESHES___"]) ecosystem.dynamicProperties["___PHYSICSMESHES___"] = {};
    return ecosystem.dynamicProperties["___PHYSICSMESHES___"];
}