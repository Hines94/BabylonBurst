import { InstancedMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { GetAsyncSceneIdentifier } from "@BabylonBurstCore/AsyncAssets";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { EntityData } from "@BabylonBurstCore/EntitySystem/EntityData";
import { EntityQuery } from "@BabylonBurstCore/EntitySystem/EntityQuery";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { PhysicsMeshComponent } from "@BabylonBurstCore/Physics/PhysicsMesh";
import { HiddenEntity, InstancedRender } from "@BabylonBurstCore/Rendering/InstancedRender";
import { Material, Scene } from "@babylonjs/core";

//NOTE: THis may not be needed if collider meshes are shown visually

// export class ColliderVisualSystem extends InstancedMeshRenderSystem {

//     GetRunnerID(rend: InstancedRender, scene: Scene): string {
//         var ret: string = rend.ModelData.FilePath + "_" + rend.ModelData.MeshName + "_";
//         ret += "_" + GetAsyncSceneIdentifier(scene);
//         ret += "_" + this.constructor.name;
//         return ret;
//     }

//     GetMaterials(instancedRend: InstancedRender, ent: EntityData, ecosystem: GameEcosystem): Material[] {
//         //TODO: Wireframe materials
//     }

//     GetInstancedRender(entity: EntityData) {
//         const mesh = new InstancedRender();
//         mesh.ModelData = entity.GetComponent(PhysicsMeshComponent).model;
//         return mesh;
//     }

//     GetRenderEntities(ecosystem: GameEcosystem): EntityQuery {
//         return ecosystem.entitySystem.GetEntitiesWithData([PhysicsMeshComponent, EntTransform], [HiddenEntity]);
//     }
// }
