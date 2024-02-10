import { EntTransform } from "../EntitySystem/CoreComponents";
import { ComponentNotify } from "../EntitySystem/EntitySystem";
import { GameEcosystem } from "../GameEcosystem";
import { GameSystem, GameSystemRunType } from "../GameLoop/GameSystem";
import { HiddenEntity, InstancedRender } from "../Rendering/InstancedRender";
import { PhysicsMasterComponent } from "./PhysicsMasterComponent";
import { PhysicsMeshComponent, PhysicsStaticMesh } from "./PhysicsMesh";


export class PhysicsSystem extends GameSystem {
    SystemOrdering = 1;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {
        ecosystem.dynamicProperties["___PHYSICSMESHES___"] = [];
        ecosystem.entitySystem.RegisterSpecificComponentChangeNotify(PhysicsMasterComponent,this.CheckRebuildMaster);
        ecosystem.entitySystem.RegisterSpecificComponentChangeNotify(EntTransform,this.CheckRebuildMesh);
        ecosystem.entitySystem.RegisterSpecificComponentChangeNotify(PhysicsMeshComponent,this.CheckRebuildMesh);
    }

    private CheckRebuildMaster(notify:ComponentNotify) {
        if(typeof notify.comp !== PhysicsMasterComponent.name) {
            return;
        }
        (notify.comp as PhysicsMasterComponent).RebuildPhysics(notify.ent.owningSystem);
    }

    private CheckRebuildMesh(notify:ComponentNotify) {
        if(!notify.ent.GetComponent(PhysicsMeshComponent)) {
            return;
        }
        notify.ent.GetComponent(PhysicsMeshComponent).updateMeshProperties();
    }

    
    RunSystem(ecosystem: GameEcosystem) {
        //Iterate all meshes
        const physEnts = ecosystem.entitySystem.GetEntitiesWithData([PhysicsMeshComponent, EntTransform], [HiddenEntity, PhysicsStaticMesh]);
        
        //Need to copy transform changes over
    }
}