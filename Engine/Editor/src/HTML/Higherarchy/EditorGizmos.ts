import { AbstractMesh, GizmoManager, Observable } from "@babylonjs/core";
import { EntTransform } from "@BabylonBurstCore/EntitySystem/CoreComponents";
import { EntityData } from "@BabylonBurstCore/EntitySystem/EntityData";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { BabylonBurstEditor } from "../../BabylonBurstEditor";
import { AddElementToEditorTopMenu, gizmosPriority } from "../../Utils/EditorTopMenu";
import { HigherarchyHTML } from "./HigherarchyHTML";
import { ParentedTransform } from "@BabylonBurstCore/EntitySystem/ParentedTransform";
import { EditorKeybinds } from "@BabylonBurstClient/InputModule";

export async function SetupEditorGizmos(higherarchy: HigherarchyHTML) {
    const ecosystem = higherarchy.ecosystem;
    if (ecosystem.dynamicProperties["EditorGizmos"] !== undefined) {
        return;
    }
    await ecosystem.waitLoadedPromise;
    ecosystem.dynamicProperties["EditorGizmos"] = new EditorGizmos(ecosystem);
    ecosystem.dynamicProperties["EditorGizmos"].HideGizmos();
    higherarchy.onEntitySelected.add(
        ecosystem.dynamicProperties["EditorGizmos"].onEntitySelected.bind(ecosystem.dynamicProperties["EditorGizmos"]),
    );
}

export class EditorGizmos {
    owner: GameEcosystem;
    gizmos: GizmoManager;
    gizmoItem: AbstractMesh;
    entityOwner: EntityData;
    changeTransformObserver = new Observable<EntTransform>();
    dropdown: HTMLSelectElement;

    bHidden = false;
    bPositionEnabled = false;
    bRotationEnabled = false;
    bScaleEnabled = false;

    constructor(owner: GameEcosystem) {
        this.owner = owner;
        this.gizmoItem = new AbstractMesh("GizmoAttacher", owner.scene);
        this.gizmos = new GizmoManager(owner.scene);
        this.gizmos.usePointerToAttachGizmos = false;
        this.gizmos.attachableMeshes = [this.gizmoItem];
        this.gizmos.attachToMesh(this.gizmoItem);
        this.owner.onUpdate.add(this.UpdateEditorGizos.bind(this));
        this.setupGizmoSelect();
        this.SetPositionGizmoEnabled();
    }

    onEntitySelected(entData: EntityData) {
        if (entData === undefined || entData === null || !entData.IsValid()) {
            this.bHidden = true;
            return;
        }
        const transform = entData.GetComponent(EntTransform);
        if (!transform) {
            this.entityOwner = undefined;
            this.bHidden = true;
            return;
        }
        this.entityOwner = entData;
        EntTransform.SetTransformForMesh(this.gizmoItem, transform);
        this.oldTransformData = EntTransform.MeshToTransform(this.gizmoItem);
        this.bHidden = false;
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

        AddElementToEditorTopMenu(this.owner, dropdown, gizmosPriority);
        const gizmo = this;
        dropdown.addEventListener("change", ev => {
            if (dropdown.value === "POS") {
                gizmo.SetPositionGizmoEnabled();
            } else if (dropdown.value === "ROT") {
                gizmo.SetRotationGizmoEnabled();
            } else if (dropdown.value === "SCALE") {
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
        this.bPositionEnabled = true;
        this.bRotationEnabled = false;
        this.bScaleEnabled = false;
        this.dropdown.value = "POS";
    }
    SetRotationGizmoEnabled() {
        if (this.gizmos.rotationGizmoEnabled) {
            return;
        }
        if (this.bHidden) {
            return;
        }
        this.bPositionEnabled = false;
        this.bRotationEnabled = true;
        this.bScaleEnabled = false;
        this.dropdown.value = "ROT";
    }
    SetScaleGizmoEnabled() {
        if (this.gizmos.scaleGizmoEnabled) {
            return;
        }
        if (this.bHidden) {
            return;
        }
        this.bPositionEnabled = false;
        this.bRotationEnabled = false;
        this.bScaleEnabled = true;
        this.dropdown.value = "SCALE";
    }

    HideGizmos() {
        if (this.gizmos.positionGizmoEnabled) {
            this.gizmos.positionGizmoEnabled = false;
        }
        if (this.gizmos.rotationGizmoEnabled) {
            this.gizmos.rotationGizmoEnabled = false;
        }
        if (this.gizmos.scaleGizmoEnabled) {
            this.gizmos.scaleGizmoEnabled = false;
        }
    }

    UpdateGizmoVisibility() {
        if (this.bHidden) {
            this.HideGizmos();
        }
        if (this.gizmos.positionGizmoEnabled !== this.bPositionEnabled) {
            this.gizmos.positionGizmoEnabled = this.bPositionEnabled;
        }
        if (this.gizmos.rotationGizmoEnabled !== this.bRotationEnabled) {
            this.gizmos.rotationGizmoEnabled = this.bRotationEnabled;
        }
        if (this.gizmos.scaleGizmoEnabled !== this.bScaleEnabled) {
            this.gizmos.scaleGizmoEnabled = this.bScaleEnabled;
        }
    }

    EnsureNotSetToEntity(entity: EntityData) {
        if (this.entityOwner === entity) {
            this.onEntitySelected(undefined);
        }
    }

    oldTransformData: EntTransform;

    UpdateEditorGizos() {
        if (
            this.entityOwner === undefined ||
            this.entityOwner === null ||
            !this.entityOwner.IsValid() ||
            this.entityOwner.GetComponent(EntTransform) === undefined
        ) {
            this.bHidden = true;
        }

        if (this.bHidden || this.gizmoItem === undefined || this.oldTransformData === undefined) {
            this.HideGizmos();
            return;
        }
        const eInputs = this.owner.InputValues as EditorKeybinds;

        if (eInputs.EDITORPOSITIONGIZMO && eInputs.EDITORPOSITIONGIZMO.wasJustActivated()) {
            this.SetPositionGizmoEnabled();
        }
        if (eInputs.EDITORROTATIONGIZMO && eInputs.EDITORROTATIONGIZMO.wasJustActivated()) {
            this.SetRotationGizmoEnabled();
        }
        if (eInputs.EDITORSCALEGIZMO && eInputs.EDITORSCALEGIZMO.wasJustActivated()) {
            this.SetScaleGizmoEnabled();
        }

        this.UpdateGizmoVisibility();

        //Set entity transform to gizmo
        var gizmoTransform = EntTransform.MeshToTransform(this.gizmoItem);
        var entTf = this.entityOwner.GetComponent(EntTransform) as EntTransform;
        if (!EntTransform.Equals(this.oldTransformData, gizmoTransform)) {
            entTf.Copy(gizmoTransform);
            if (this.entityOwner.GetComponent(ParentedTransform)) {
                const parTF = this.entityOwner.GetComponent(ParentedTransform).parentEntity;
                if (parTF && parTF.IsValid()) {
                    this.entityOwner.GetComponent(ParentedTransform).childRelative =
                        ParentedTransform.GetRelativeTrasnsform(gizmoTransform, parTF.GetComponent(EntTransform)); //TODO: Caclaulate relative
                }
            }
        }
        EntTransform.SetTransformForMesh(this.gizmoItem, entTf);
        this.oldTransformData = gizmoTransform;
    }
}
