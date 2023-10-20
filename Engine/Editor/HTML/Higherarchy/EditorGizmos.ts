import { AbstractMesh, GizmoManager, Observable } from "@babylonjs/core";
import { EntTransform } from "@engine/EntitySystem/CoreComponents";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { GameEcosystem } from "@engine/GameEcosystem";
import { BabylonBurstEditor } from "../../BabylonBurstEditor";
import { AddElementToEditorTopMenu } from "../../Utils/EditorTopMenu";

export async function SetupEditorGizmos(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties["EditorGizmos"] !== undefined) {
        return;
    }
    await ecosystem.waitLoadedPromise;
    ecosystem.dynamicProperties["EditorGizmos"] = new EditorGizmos(ecosystem);
    ecosystem.dynamicProperties["EditorGizmos"].HideGizmos();
    (ecosystem as BabylonBurstEditor).onEntitySelected.add(ecosystem.dynamicProperties["EditorGizmos"].onEntitySelected.bind(ecosystem.dynamicProperties["EditorGizmos"]))

}

export class EditorGizmos {
    owner: GameEcosystem;
    gizmos: GizmoManager;
    gizmoItem: AbstractMesh;
    entityOwner: EntityData;
    changeTransformObserver = new Observable<EntTransform>();
    dropdown: HTMLSelectElement;

    bHidden = false;

    constructor(owner: GameEcosystem) {
        this.owner = owner;
        this.gizmoItem = new AbstractMesh("GizmoAttacher", owner.scene);
        this.gizmos = new GizmoManager(owner.scene);
        this.gizmos.usePointerToAttachGizmos = false;
        this.gizmos.attachableMeshes = [this.gizmoItem];
        this.gizmos.attachToMesh(this.gizmoItem);
        this.owner.onUpdate.add(this.UpdateEditorGizos.bind(this));
        this.setupGizmoSelect();
    }

    onEntitySelected(entData:EntityData) {
        if(entData === undefined) {
            this.HideGizmos();
            return;
        }
        const transform = entData.GetComponent(EntTransform);;
        if (!transform) {
            this.entityOwner = undefined;
            this.HideGizmos();
            return;
        }
        this.entityOwner = entData;
        this.oldTransformData = transform;
        EntTransform.SetTransformForMesh(this.gizmoItem, transform);
    }

    setupGizmoSelect() {
        const dropdown = this.owner.doc.createElement("select");
        dropdown.classList.add("SFSelect");
        const posType = this.owner.doc.createElement("option");
        posType.innerText = "Position - E";
        posType.value = "POS";
        const rotType = this.owner.doc.createElement("option");
        rotType.innerText = "Rotation - R";
        rotType.value = "ROT";
        const scaleType = this.owner.doc.createElement("option");
        scaleType.innerText = "Scale - F";
        scaleType.value = "SCALE";
        const hideType = this.owner.doc.createElement("option");
        hideType.innerText = "Hide Gizmos";
        hideType.value = "NONE";
        dropdown.appendChild(posType);
        dropdown.appendChild(rotType);
        dropdown.appendChild(scaleType);
        dropdown.appendChild(hideType);

        AddElementToEditorTopMenu(this.owner,dropdown,10000);
        const gizmo = this;
        dropdown.addEventListener("change", ev => {
            if (dropdown.value === "POS") {
                this.bHidden = false;
                gizmo.SetPositionGizmoEnabled();
            } else if (dropdown.value === "ROT") {
                this.bHidden = false;
                gizmo.SetRotationGizmoEnabled();
            } else if (dropdown.value === "SCALE") {
                this.bHidden = false;
                gizmo.SetScaleGizmoEnabled();
            } else if (dropdown.value === "NONE") {
                this.HideGizmos();
                this.bHidden = true;
            }
        });
        this.dropdown = dropdown;
    }

    SetPositionGizmoEnabled() {
        if (this.gizmos.positionGizmoEnabled) {
            return;
        }
        if (this.bHidden) {
            return;
        }
        this.gizmos.positionGizmoEnabled = true;
        this.gizmos.rotationGizmoEnabled = false;
        this.gizmos.scaleGizmoEnabled = false;
        this.dropdown.value = "POS";
    }
    SetRotationGizmoEnabled() {
        if (this.gizmos.rotationGizmoEnabled) {
            return;
        }
        if (this.bHidden) {
            return;
        }
        this.gizmos.positionGizmoEnabled = false;
        this.gizmos.rotationGizmoEnabled = true;
        this.gizmos.scaleGizmoEnabled = false;
        this.dropdown.value = "ROT";
    }
    SetScaleGizmoEnabled() {
        if (this.gizmos.scaleGizmoEnabled) {
            return;
        }
        if (this.bHidden) {
            return;
        }
        this.gizmos.positionGizmoEnabled = false;
        this.gizmos.rotationGizmoEnabled = false;
        this.gizmos.scaleGizmoEnabled = true;
        this.dropdown.value = "SCALE";
    }
    HideGizmos() {
        this.gizmos.positionGizmoEnabled = false;
        this.gizmos.rotationGizmoEnabled = false;
        this.gizmos.scaleGizmoEnabled = false;
    }

    EnsureNotSetToEntity(entity: EntityData) {
        if (this.entityOwner === entity) {
            this.onEntitySelected(undefined);
        }
    }

    oldTransformData: EntTransform;

    UpdateEditorGizos() {
        if (this.entityOwner === undefined) {
            this.HideGizmos();
            return;
        }

        if (this.owner.InputValues.Ekey.wasJustActivated()) {
            this.SetPositionGizmoEnabled();
        }
        if (this.owner.InputValues.Rkey.wasJustActivated()) {
            this.SetRotationGizmoEnabled();
        }
        if (this.owner.InputValues.Gkey.wasJustActivated()) {
            this.SetScaleGizmoEnabled();
        }

        //Set entity transform to gizmo
        const transformData = EntTransform.MeshToTransform(this.gizmoItem);
        if (EntTransform.Equals(this.oldTransformData, transformData)) {
            return;
        }
        const entTf = this.entityOwner.GetComponent(EntTransform) as EntTransform;
        entTf.Copy(transformData);
    }
}
