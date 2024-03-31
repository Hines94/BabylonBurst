import { Mesh, Observable, PhysicsBody, PhysicsMotionType } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { GameEcosystem, GetEcosystemFromEntitySystem } from "../GameEcosystem";
import { defaultLayerMask } from "../../../Client/src/Utils/LayerMasks";
import { GetPhysicsTriggerWireframeMat, GetPhysicsWireframeMat } from "./PhysicsMaterials";

@RegisteredType(PhysicsStaticItem,{ RequiredComponents:[EntTransform], bEditorAddable:false, bEditorRemovable:false, comment:"A static physics item that is built not to move"})
export class PhysicsStaticItem extends Component {

}

export class CustomPhysicBody extends PhysicsBody {
    owningPhysicsItems:PhysicsItem[];
}

var warned = false;

@RegisteredType(PhysicsItem,{ RequiredComponents:[EntTransform], bEditorAddable:false})
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

    onMeshRebuilt = new Observable<PhysicsItem>();

    abstract isValidItem():Boolean;
    /** Should be overwritten with specific method for getting our mesh (eg box or sphere) including physics body */
    async GetPhysicsMesh():Promise<Mesh>{return undefined;}
    /** Unique name to identify exactly this physics mesh */
    abstract GetPhysicsMeshName():string;

    onComponentAdded(): void {
        this.entityOwner.GetComponent(EntTransform).componentChanged.add(this.onComponentChanged.bind(this));
    }

    onComponentChanged(): void {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem); 

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
            console.error("TODO: reassign all meshes in PhysicMesh.owningPhysicsItems")
            //TODO: update all other meshes to reflect new instance numbers?
            this.physicsMesh = undefined;
            this.physicsInstanceNumber = -1;
            return;
        }
        this.physicsMesh = undefined;
    }

    async LoadMeshIn() {
        const ecosystem = GetEcosystemFromEntitySystem(this.entityOwner.owningSystem);

        const savedMeshes = GetSavedPhysicsMeshes(ecosystem);
        const thisMeshName = `${this.triggerOnly}_${this.GetPhysicsMeshName()}`;
        var physicMesh:Mesh = savedMeshes[thisMeshName];

        const positionMatrix = EntTransform.getAsInstanceTransform(this.entityOwner.GetComponent(EntTransform)).getMatrix();
        
        if(!physicMesh) {
            physicMesh = await this.GetPhysicsMesh();

            if(!physicMesh) {
                this.removeOldPhysicsMesh();
                return;
            }

            if(!physicMesh.physicsBody && ecosystem.isGame) {
                if(!ecosystem.scene.getPhysicsEngine()) {
                    console.error("Trying to build physics with no engine enabled");
                }
                physicMesh.isVisible = false;
                physicMesh.layerMask = defaultLayerMask;
                physicMesh.thinInstanceAdd(positionMatrix);
                savedMeshes[thisMeshName] = physicMesh;
                physicMesh.physicsBody = this.generatePhysicsBody(ecosystem,physicMesh);
            }
        }

        if(physicMesh === this.physicsMesh) {
            this.updateMeshProperties();
            return;
        }

        //Create a new instance for this entity
        this.physicsMesh = physicMesh;

        const customPhys = physicMesh.physicsBody as CustomPhysicBody;
        // Workaround https://forum.babylonjs.com/t/instanced-physics-static-mesh/49031/4 required at least 1 ahead of time
        if(!customPhys.owningPhysicsItems) {
            customPhys.owningPhysicsItems = [this];
            this.physicsInstanceNumber = 0;
        } else {
            customPhys.owningPhysicsItems.push(this);
            this.physicsInstanceNumber = this.physicsMesh.thinInstanceAdd(positionMatrix);
            this.physicsMesh.physicsBody.updateBodyInstances();
        }

        //Debug properties
        this.physicsMesh.material = this.triggerOnly ? GetPhysicsTriggerWireframeMat(ecosystem) : GetPhysicsWireframeMat(ecosystem);
        if(ecosystem.dynamicProperties["___PHYSICSDEBUGMODE___"]) {
            this.physicsMesh.isVisible = true;
        }
        
        this.onMeshRebuilt.notifyObservers(this);

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