import { InstancedMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { AsyncStaticMeshInstanceRunner } from "@BabylonBurstCore/AsyncAssets";
import { AsyncSkeletalMeshInstanceRunner } from "@BabylonBurstCore/AsyncAssets/AsyncSkeletalMeshInstanceRunner";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { EntityData } from "@BabylonBurstCore/EntitySystem/EntityData";
import { EntityQuery } from "@BabylonBurstCore/EntitySystem/EntityQuery";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { HiddenEntity, InstancedSkeletalRender } from "@BabylonBurstCore/Rendering/InstancedRender";
import { Material } from "@babylonjs/core";

export class InstancedSkeletalMeshRenderSystem extends InstancedMeshRenderSystem {
    override GetAsyncStaticMeshInstanceRunner(
        filePath: string,
        fileName: string,
        meshName: string,
        mats: Material[],
        layerMask: number,
        ecosystem: GameEcosystem,
    ): AsyncStaticMeshInstanceRunner {
        return new AsyncSkeletalMeshInstanceRunner(filePath, meshName, mats, fileName, layerMask);
    }

    override GetRenderEntities(ecosystem: GameEcosystem): EntityQuery {
        return ecosystem.entitySystem.GetEntitiesWithData([InstancedSkeletalRender, EntTransform], [HiddenEntity]);
    }

    override GetInstancedRender(entity: EntityData) {
        return entity.GetComponent(InstancedSkeletalRender);
    }
}
