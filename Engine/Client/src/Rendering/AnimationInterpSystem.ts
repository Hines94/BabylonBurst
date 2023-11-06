import { GameEcosystem } from "@engine/GameEcosystem";
import { GameSystem, GameSystemRunType } from "@engine/GameLoop/GameSystem";

export class AnimationInterpSystem extends GameSystem {
    systemRunType = GameSystemRunType.GameAndEditor;
    SystemOrdering = 0;
    RateLimit = 3;

    SetupGameSystem(ecosystem: GameEcosystem) {}

    RunSystem(ecosystem: GameEcosystem) {
        //Anim interp is needed if we are running higher framerates to smooth movement
        ecosystem.sceneSettings.SetAnimationInterp(1 / ecosystem.deltaTime > 50);
    }
}
