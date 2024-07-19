import { InstancedMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedMeshRenderSystem";
import { InstancedSkeletalMeshRenderSystem } from "@BabylonBurstClient/Rendering/InstancedSkeletalMeshRenderSystem";
import { SkeletalMeshCloneDetails } from "@BabylonBurstCore/AsyncAssets";
import { AsyncSkeletalMeshInstanceRunner } from "@BabylonBurstCore/AsyncAssets/AsyncSkeletalMeshInstanceRunner";
import { EntTransform, EntVector3, EntVector4 } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { GameSystem } from "@BabylonBurstCore/GameLoop/GameSystem";
import { GetSystemOfType } from "@BabylonBurstCore/GameLoop/GameSystemLoop";
import { ClonedSkeletalRender, SkeletalAnimationSpecifier } from "@BabylonBurstCore/Rendering/InstancedRender";

export class ClonedSkeletalMeshSystem extends GameSystem {
    SystemOrdering: number;
    SetupGameSystem(ecosystem: GameEcosystem) {}
    RunSystem(ecosystem: GameEcosystem, deltaTime: number) {
        // Run clone transforms
        ecosystem.entitySystem.GetEntitiesWithData([ClonedSkeletalRender], []).iterateEntities(e => {
            const tf = e.GetComponent(EntTransform);
            const clone = e.GetComponent(ClonedSkeletalRender);
            if (!clone.clone) {
                if (!clone.ModelData || !clone.ModelData.FileName) return;
                // Get the mesh runner ready to generate the mesh
                const runnerID = GetSystemOfType(InstancedSkeletalMeshRenderSystem).GetRunnerID(clone, ecosystem.scene);
                if (!ecosystem.dynamicProperties.LoadedRunners) {
                    ecosystem.dynamicProperties.LoadedRunners = [];
                }
                if (!ecosystem.dynamicProperties.LoadedRunners[runnerID]) {
                    ecosystem.dynamicProperties.LoadedRunners[runnerID] = new AsyncSkeletalMeshInstanceRunner(
                        clone.ModelData.FilePath,
                        clone.ModelData.MeshName,
                        [],
                        clone.ModelData.FileName,
                        GetSystemOfType(InstancedSkeletalMeshRenderSystem).GetLayerMask(clone, e),
                    );
                }
                // Generate the mesh
                clone.clone = (
                    ecosystem.dynamicProperties.LoadedRunners[runnerID] as AsyncSkeletalMeshInstanceRunner
                ).getMeshClone(ecosystem.scene, true);
                clone.description = ecosystem.dynamicProperties.LoadedRunners[runnerID];
                //TODO: setup or change materials for clone
            }
            clone.clone.setClonePosition(EntVector3.GetVector3(tf.Position));
            clone.clone.setCloneRotation(EntVector4.GetQuaternion(tf.Rotation));
            clone.clone.setCloneScale(EntVector3.GetVector3(tf.Scale));
        });

        // Run clone animations
        ecosystem.entitySystem
            .GetEntitiesWithData([ClonedSkeletalRender, SkeletalAnimationSpecifier], [])
            .iterateEntities(e => {
                const skr = e.GetComponent(ClonedSkeletalRender);
                if (!skr.clone || !skr.clone.bCloneCreated) return;
                const ac = e.GetComponent(SkeletalAnimationSpecifier);
                const clonedAn = "Clone of " + ac.AnimationName;
                if (ac.AnimationName && (!skr.playingAnimation || skr.playingAnimation.name != clonedAn)) {
                    this.clearRunningAnim(skr, ecosystem);
                    const anim = skr.clone.animations.find(a => {
                        return a.name === clonedAn;
                    });
                    if (anim) {
                        anim.play(true);
                        skr.playingAnimation = anim;
                    }
                } else if (!ac.AnimationName) {
                    this.clearRunningAnim(skr, ecosystem);
                }
            });
    }

    private clearRunningAnim(skr: ClonedSkeletalRender, ecosystem: GameEcosystem) {
        if (skr.playingAnimation) {
            skr.playingAnimation.stop();
        }
    }
}
