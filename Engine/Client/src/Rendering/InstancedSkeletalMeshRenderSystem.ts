import { InstancedMeshData, InstancedMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { AsyncStaticMeshInstanceRunner, InstancedMeshTransform } from "@BabylonBurstCore/AsyncAssets";
import {
    AsyncSkeletalMeshInstanceRunner,
    SkeletalData,
} from "@BabylonBurstCore/AsyncAssets/AsyncSkeletalMeshInstanceRunner";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { EntityData } from "@BabylonBurstCore/EntitySystem/EntityData";
import { EntityQuery } from "@BabylonBurstCore/EntitySystem/EntityQuery";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import {
    HiddenEntity,
    InstancedSkeletalRender,
    SkeletalAnimationSpecifier,
} from "@BabylonBurstCore/Rendering/InstancedRender";
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
        //@ts-ignore - we know we just need to match the RunTransformSystem method
        return new AsyncSkeletalMeshInstanceRunner(filePath, meshName, mats, fileName, layerMask);
    }

    override RunTransformSystem(
        transformSystem: AsyncStaticMeshInstanceRunner,
        data: InstancedMeshData,
        ecosystem: GameEcosystem,
    ): void {
        super.RunTransformSystem(transformSystem, data, ecosystem);
        //@ts-ignore
        const tf = transformSystem as AsyncSkeletalMeshInstanceRunner;
        const skData: SkeletalData[] = getAnimationData();
        tf.RunAnimationSystem(ecosystem.scene, skData, ecosystem.deltaTime * this.getAnimationTimeScale(ecosystem));

        function getAnimationData() {
            const skData: SkeletalData[] = [];
            if (data) {
                data.entityData.forEach(e => {
                    const ent = ecosystem.entitySystem.GetEntityData(e);
                    const anim = ent.GetComponent(SkeletalAnimationSpecifier);
                    if (anim.bRandomOffsetFrame && anim.frameOffset == 0) {
                        const ai = tf.GetAnimRange(anim.AnimationName);
                        if (ai) {
                            anim.frameOffset = Math.random() * (ai.to - ai.from);
                        }
                    }
                    skData.push(anim);
                });
            }
            return skData;
        }
    }

    override GetRenderEntities(ecosystem: GameEcosystem): EntityQuery {
        return ecosystem.entitySystem.GetEntitiesWithData([InstancedSkeletalRender, EntTransform], [HiddenEntity]);
    }

    override GetInstancedRender(entity: EntityData) {
        return entity.GetComponent(InstancedSkeletalRender);
    }
}
