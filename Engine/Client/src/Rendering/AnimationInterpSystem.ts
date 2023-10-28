import { GameEcosystem } from "@engine/GameEcosystem";
import { GameSystem } from "@engine/GameLoop/GameSystem";


export class AnimationInterpSystem extends GameSystem {
    SystemOrdering = 0;
    RateLimit = 3;
    RunSystem(ecosystem: GameEcosystem) {
        //Anim interp is needed if we are running higher framerates to smooth movement
        ecosystem.sceneSettings.SetAnimationInterp(1 / ecosystem.deltaTime > 50);
    }

}