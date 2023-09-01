import { Mesh, MeshBuilder, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";
import { AngleToRad } from "@BabylonBoostClient/Utils/MathUtils";
import { EntVector4 } from "@BabylonBoostClient/EntitySystem/CoreComponents";

/** Simply takes the player camera and runs a simple movement  */
export class EditorCamera {
    sphereMesh: Mesh;

    constructor(ecosystem: GameEcosystem) {
        this.sphereMesh = MeshBuilder.CreateSphere(
            "EditorSphere",
            {
                diameter: 1,
            },
            ecosystem.scene
        );
        this.sphereMesh.position = new Vector3(0, 2, -5);
        this.sphereMesh.rotation.x = AngleToRad(20);
    }

    UpdateCamera(ecosystem: GameEcosystem) {
        if (!ecosystem.InputValues) {
            return;
        }
        ecosystem.camera.UpdateCamera(
            this.sphereMesh.position,
            EntVector4.EulerToQuaternion(this.sphereMesh.rotation),
            ecosystem
        );
        var moveSens = 10;
        if(ecosystem.InputValues.shift.isActive) {
            moveSens = moveSens*2;
        }
        
        const forDes = ecosystem.InputValues.forward * ecosystem.deltaTime * moveSens;
        const sideDes = ecosystem.InputValues.side * ecosystem.deltaTime * moveSens;
        const upDes = ecosystem.InputValues.up * ecosystem.deltaTime * moveSens;
        this.sphereMesh.position = this.sphereMesh.position.add(
            this.sphereMesh.forward.multiplyByFloats(forDes, forDes, forDes)
        );
        this.sphereMesh.position = this.sphereMesh.position.add(
            this.sphereMesh.right.multiplyByFloats(sideDes, sideDes, sideDes)
        );
        this.sphereMesh.position = this.sphereMesh.position.add(
            this.sphereMesh.up.multiplyByFloats(upDes, upDes, upDes)
        );

        const rotSens = 10;
        this.sphereMesh.rotation.y =
            this.sphereMesh.rotation.y + ecosystem.camera.DesiredRotationChange.x * ecosystem.deltaTime * -rotSens;
        this.sphereMesh.rotation.x =
            this.sphereMesh.rotation.x + ecosystem.camera.DesiredRotationChange.y * ecosystem.deltaTime * rotSens;
        this.sphereMesh.rotation.z = 0;
    }
}
