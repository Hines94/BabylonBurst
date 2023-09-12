import { DirectionalLight, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "@engine/GameEcosystem";

export function RunDirectionalLightSystem(ecosystem: GameEcosystem) {
    var p = new DirectionalLight("light", new Vector3());
}
