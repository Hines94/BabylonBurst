import { SetInspectorOwner } from "../InspectorWindow/InspectorHTML";
import { RemoveClassFromAllItems, WaitForEvent } from "@BabylonBurstClient/HTML/HTMLUtils";
import { EntitySpecification, GetComponent, RawEntityData } from "@BabylonBurstClient/EntitySystem/EntityMsgpackConverter";
import { BabylonBurstEditor } from "../../BabylonBurstEditor";
import { ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { GetEditorGizmos } from "./EditorGizmos";
import { EntityInspectorHTML } from "./EntityInspectorHTML";
import { GameEcosystem } from "@engine/GameEcosystem";

/** Can display entities in a higherarchy with clickable options (delete/add etc). Also hooks into inspector. */
export abstract class HigherarchyHTML {
    higherarchyItems: HTMLElement;
    allEntities: RawEntityData;
    Displayer: { loadingElement: Promise<HTMLDivElement>; window: Window };
    windowDoc: Document;
    inspector: HTMLElement;
    higherarchPanel: HTMLElement;
    contentOptions: HTMLElement;
    ecosystem: GameEcosystem;
    generatedEntityRows: { [entId: number]: HTMLDivElement } = {};

    setEcosystem(ecosystem:GameEcosystem) {
        this.ecosystem = ecosystem;
        ecosystem.entitySystem.onEntityCreatedEv.add(this.GenerateEntityRow.bind(this));
        ecosystem.entitySystem.onEntityRemovedEv.add(this.RemoveEntityRow.bind(this));
    }

    protected setupHigherarchyEcosystem() {
        const gamePanel = this.windowDoc.getElementById("renderCanvas");
        this.setEcosystem(new BabylonBurstEditor(gamePanel as HTMLCanvasElement, {
            noHTML: true,
        }));
        const higherarchy = this;
        this.Displayer.window.addEventListener("beforeunload", function (e) {
            higherarchy.ecosystem.dispose();
        });
    }

    protected setupEditorPanel() {
        const uploader = this.windowDoc.getElementById("ContentUpload");
        uploader.classList.add("hidden");
        this.higherarchPanel = this.windowDoc.getElementById("Higherarchy");
        this.higherarchyItems = this.higherarchPanel.querySelector("#HigherarchyItems");
        this.inspector = this.windowDoc.getElementById("InspectorPanel");
        this.contentOptions = this.windowDoc.getElementById("ContentOptions");
    }

    protected setupRightClick() {
        const higherarchy = this;
        higherarchy.Displayer.window.document.addEventListener("contextmenu", ev => {
            if (ev.target != higherarchy.higherarchPanel) {
                return;
            }
            higherarchy.setupContextMenu(ev);
        });
    }

    /** Add entity etc */
    protected setupContextMenu(event: MouseEvent) {}


    /** Reset our WASM module to same as the JS data */
    RefreshWASMToData() {
        this.ecosystem.wasmWrapper.LoadMsgpackDataToExistingEntities(this.allEntities, false);
        this.ecosystem.wasmWrapper.FlushEntitySystem();
    }

    /** Refresh just the entity Id's*/
    RefreshDataToWASMCore() {
        this.allEntities = {};
        this.ecosystem.wasmWrapper.GetAllEntitiesInWASM().forEach(e=>{
            this.allEntities[e] = {};
        })
    }

    /** Reset our WASM module to same as JS data for specific entity */
    RefreshWASMForSpecificEntity(entId:number) {
        const specificLoad:RawEntityData = {};
        specificLoad[entId] = this.allEntities[entId];
        this.ecosystem.wasmWrapper.LoadMsgpackDataToExistingEntities(specificLoad, false);
        this.ecosystem.wasmWrapper.FlushEntitySystem();
    }

    /** Full wipe */
    ResetWASMEntities() {
        this.ecosystem.wasmWrapper.ResetEntitySystem();
    }

    /** Rebuild Entities and entity rows */
    RegenerateHigherarchy() {
        const entityIds = Object.keys(this.allEntities);
        //Generate new entities and higherarchy data
        for (var i = 0; i < entityIds.length; i++) {
            if (this.generatedEntityRows[parseInt(entityIds[i])] === undefined) {
                const entId = parseInt(entityIds[i]);
                this.GenerateEntityRow(entId);
            }
        }
        //Remove old entities that no longer exist
        for (let entId in this.generatedEntityRows) {
            if (entityIds.includes(entId) === false) {
                this.generatedEntityRows[entId].remove();
                delete this.generatedEntityRows[entId];
            }
        }
    }

    /** Entity row on higherarchy that lets us select and TODO: re-parent etc */
    GenerateEntityRow(entId: number): HTMLDivElement {
        if(this.allEntities[entId]===undefined) {
            this.allEntities[entId] = {};
        }

        //Basic items
        const row = this.windowDoc.createElement("div");
        this.generatedEntityRows[entId] = row;
        row.style.marginTop = "2px";
        row.classList.add("higherarchyEntity");
        const entityId = this.windowDoc.createElement("p");
        entityId.innerText += "Entity " + entId;
        entityId.classList.add("higherarchEntityText");
        row.appendChild(entityId);
        this.higherarchyItems.appendChild(row);
        row.style.marginLeft = (this.GetPrefabInsetLevel(this.allEntities[entId]) * 10).toString() + "%";

        //View Entity components etc
        row.addEventListener("click", async () => {
            //Update data for specific entity
            this.allEntities[entId] = this.ecosystem.wasmWrapper.GetDataForEntity(entId,false);

            RemoveClassFromAllItems("selectedHigherarchy", this.higherarchyItems);
            row.classList.add("selectedHigherarchy");
            this.inspector.innerHTML = "";
            this.inspector.classList.remove("hidden");
            SetInspectorOwner(row);
            this.setupInspectorForEntity(entId);
            GetEditorGizmos(this.ecosystem).SetupToEntity(entId);
            GetEditorGizmos(this.ecosystem).SetPositionGizmoEnabled();
        });
        //Entity context menu
        row.addEventListener("contextmenu", event => {
            // this.ourContentHolder.unclickAllItems();
            // this.ourSelectable.classList.add("selectedContent");
            ShowContextMenu(
                event,
                [
                    {
                        name: "Delete Entity",
                        callback: () => {
                            if (this.windowDoc.defaultView.confirm("Delete Entity " + entId + "?")) {
                                row.remove();
                                delete this.allEntities[entId];
                                this.ecosystem.wasmWrapper.DelayedRemoveEntity(entId);
                                this.RegenerateHigherarchy();
                            }
                        },
                    },
                ],
                this.inspector.ownerDocument
            );
        });
        return row;
    }

    RemoveEntityRow(entId:number) {
        delete this.allEntities[entId];
        this.RegenerateHigherarchy();
    }

    protected GetPrefabInsetLevel(entity: EntitySpecification): number {
        if(entity[Prefab.name] === undefined) {
            return 0;
        }
        if (GetComponent(entity, Prefab)) {
            return 1;
        }
        return 0;
    }

    protected addNewEntity(): number {
        const keys = Object.keys(this.allEntities);
        var found = true;
        var newEntId = 1;
        while (found) {
            if (keys.includes(newEntId.toString())) {
                newEntId++;
                continue;
            }
            found = false;
        }
        this.allEntities[newEntId] = {};
        this.RefreshWASMForSpecificEntity(newEntId);
        return newEntId;
    }

    addComponentToEntity(entityId: number, compType: any, allEntComps: HTMLElement): boolean {
        const entity = this.allEntities[entityId];
        if (entity[compType.name] !== undefined) {
            return true;
        }

        //Add other components
        if (compType.GetRequiredComponents) {
            const otherComponents = compType.GetRequiredComponents();
            for (var i = 0; i < otherComponents.length; i++) {
                if (!this.addComponentToEntity(entityId, otherComponents[i], allEntComps)) {
                    return false;
                }
            }
        }

        //Set component as added
        entity[compType.name] = {};
        this.RefreshWASMForSpecificEntity(entityId);
        this.refreshInspectorIfEntity(entityId);

        return true;
    }

    currrentInspector: EntityInspectorHTML;
    refreshInspectorIfEntity(entityId: number) {
        if (this.currrentInspector === undefined) {
            return;
        }
        if (this.currrentInspector.entityId !== entityId) {
            return;
        }
        this.setupInspectorForEntity(entityId);
    }

    /** For a given entity setup our inspector so we can see what components are present */
    setupInspectorForEntity(entityId: number) {
        if (this.currrentInspector) {
            this.currrentInspector.dispose();
        }
        this.currrentInspector = new EntityInspectorHTML(this, entityId);
    }
}
