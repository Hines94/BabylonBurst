import { ComponentNotify } from "../EntitySystem/EntitySystem";
import { GameEcosystem } from "../GameEcosystem";
import { GameSystem, GameSystemRunType } from "../GameLoop/GameSystem";
import { PhysicsBoxComponent } from "./PhysicsBox";
import { GetSavedPhysicsMeshes } from "./PhysicsItem";
import { PhysicsItemCollisionListener } from "./PhysicsItemCollisionListener";
import { PhysicsMasterComponent } from "./PhysicsMasterComponent";
import { PhysicsMeshComponent, PhysicsStaticMesh } from "./PhysicsMesh";


export class PhysicsSystem extends GameSystem {
    SystemOrdering = 1;
    systemRunType = GameSystemRunType.GameAndEditor;

    SetupGameSystem(ecosystem: GameEcosystem) {
        ecosystem.dynamicProperties["___PHYSICSMESHES___"] = [];
        ecosystem.entitySystem.RegisterSpecificComponentChangeNotify(PhysicsMasterComponent,this.CheckRebuildMaster);
        
        ecosystem.onChangeDynamicProperty.add((k)=>{
            if(k === '___PHYSICSDEBUGMODE___') {
                const isVis = ecosystem.dynamicProperties['___PHYSICSDEBUGMODE___'] ? true : false;
                const savedMeshes = GetSavedPhysicsMeshes(ecosystem);
                Object.keys(savedMeshes).forEach(k=>{
                    if(savedMeshes[k])savedMeshes[k].isVisible = isVis;
                })
            }
        })
    }

    private CheckRebuildMaster(notify:ComponentNotify) {
        if(typeof notify.comp !== PhysicsMasterComponent.name) {
            return;
        }
        (notify.comp as PhysicsMasterComponent).RebuildPhysics(notify.ent.owningSystem);
    }

    //This is just so the physics comps are pulled into the build (they are childs)
    private importsRequirement(){
        new PhysicsMeshComponent();
        new PhysicsBoxComponent();
        new PhysicsItemCollisionListener();
    }
    
    RunSystem(ecosystem: GameEcosystem) {
        //TODO: Iterate all meshes
        //const physEnts = ecosystem.entitySystem.GetEntitiesWithData([PhysicsMeshComponent, EntTransform], [HiddenEntity, PhysicsStaticMesh]);
        
        //Need to copy transform changes over
    }
}