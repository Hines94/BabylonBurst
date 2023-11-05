import { SetInspectorOwner } from "../InspectorWindow/InspectorHTML";
import { RemoveClassFromAllItems, WaitForEvent } from "@BabylonBurstClient/HTML/HTMLUtils";
import { BabylonBurstEditor } from "../../BabylonBurstEditor";
import { ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { EntityInspectorHTML } from "./EntityInspectorHTML";
import { GameEcosystem } from "@engine/GameEcosystem";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { Prefab } from "@engine/EntitySystem/Prefab";
import { storedRegisteredType } from "@engine/EntitySystem/TypeRegister";
import { SetupEditorGizmos } from "./EditorGizmos";
import { ComponentNotify } from "@engine/EntitySystem/EntitySystem";
import { EntNamingComponent } from "@engine/EntitySystem/CoreComponents";
import { Observable } from "@babylonjs/core";

/** Can display entities in a higherarchy with clickable options (delete/add etc). Also hooks into inspector. */
export abstract class HigherarchyHTML {
    higherarchyItems: HTMLElement;
    Displayer: { loadingElement: Promise<HTMLDivElement>; window: Window };
    inspector: HTMLElement;
    higherarchPanel: HTMLElement;
    contentOptions: HTMLElement;
    ecosystem: BabylonBurstEditor;
    generatedEntityRows: { [entId: number]: HTMLDivElement } = {};

    onEntitySelected = new Observable<EntityData>();

    setEcosystem(ecosystem:GameEcosystem) {
        this.ecosystem = ecosystem as BabylonBurstEditor;
    }

    protected setupHigherarchyEcosystem() {
        const gamePanel = this.Displayer.window.document.getElementById("renderCanvas");
        this.setEcosystem(new BabylonBurstEditor(gamePanel as HTMLCanvasElement, {
            noHTML: true,
        }));
        const higherarchy = this;
        this.Displayer.window.addEventListener("beforeunload", function (e) {
            higherarchy.ecosystem.dispose();
        });
    }

    protected finishUISetup() {
        //Setup UI
        const uploader = this.ecosystem.doc.getElementById("ContentUpload");
        uploader.classList.add("hidden");
        this.higherarchPanel = this.ecosystem.doc.getElementById("Higherarchy");
        (this.higherarchPanel as any).OwningHigherarchElement = this;
        this.higherarchyItems = this.higherarchPanel.querySelector("#HigherarchyItems");
        this.inspector = this.ecosystem.doc.getElementById("InspectorPanel");
        this.contentOptions = this.ecosystem.doc.getElementById("ContentOptions");

        //Setup events to update UI when we change
        this.ecosystem.entitySystem.onEntityCreatedEv.add(this.GenerateEntityRow.bind(this));
        this.ecosystem.entitySystem.onEntityRemovedEv.add(this.RemoveEntityRow.bind(this));
        this.ecosystem.entitySystem.onComponentAddedEv.add(this.EntCompAddChange.bind(this));
        this.ecosystem.entitySystem.onComponentChangedEv.add(this.EntCompAddChange.bind(this));
        SetupEditorGizmos(this);
    }

    HideHigherarchy() {
        this.higherarchPanel.classList.add("hidden");
        this.setupInspectorForEntity(undefined);
    }

    ShowHigherarchy() {
        this.higherarchPanel.classList.remove("hidden");
    }

    protected setupRightClick() {
        const higherarchy = this;
        higherarchy.Displayer.window.document.addEventListener("contextmenu", ev => {
            if (ev.target != higherarchy.higherarchPanel) {
                return;
            }
            higherarchy.setupContextMenu(ev);
        });
        this.setupNormalClick();
    }

    protected setupNormalClick() {
        const higherarchy = this;
        higherarchy.Displayer.window.document.addEventListener("click", ev => {
            if (ev.target != higherarchy.higherarchPanel) {
                return;
            }
            this.setupInspectorForEntity(undefined);
        });
    }

    /** Add entity etc */
    protected setupContextMenu(event: MouseEvent) {}

    /** Rebuild Entities and entity rows */
    RegenerateHigherarchy() {
        const allEnts = this.ecosystem.entitySystem.GetEntitiesWithData([],[]);
        //Generate new entities and higherarchy data
        allEnts.iterateEntities((e:EntityData)=>{
            if (this.generatedEntityRows[e.EntityId] === undefined) {
                this.GenerateEntityRow(e.EntityId);
            }
        })
        //Remove old entities that no longer exist
        for (let entId in this.generatedEntityRows) {
            if (!allEnts.FindEntity(parseInt(entId))) {
                this.generatedEntityRows[entId].remove();
                delete this.generatedEntityRows[entId];
            }
        }
    }

    EntCompAddChange(entData:ComponentNotify) {
        if(entData.comp.constructor.name === "Prefab" && this.generatedEntityRows[entData.ent.EntityId]) {
            this.setEntRowInset(this.generatedEntityRows[entData.ent.EntityId],entData.ent.EntityId);
        }  
        if(entData.comp.constructor.name === "EntNamingComponent") {
            this.setEntityName(this.generatedEntityRows[entData.ent.EntityId],entData.ent);
        }
    }

    setEntityName(row: HTMLDivElement, entData:EntityData) {
        const namingComp = entData.GetComponent(EntNamingComponent);
        if(namingComp === undefined || namingComp.EntName === undefined  || namingComp.EntName === "") {
            row.innerText = `Entity: ${entData.EntityId}`;
        } else {
            row.innerText = `Entity: ${entData.EntityId} - ${namingComp.EntName}`;
        }
    }

    /** Entity row on higherarchy that lets us select and TODO: re-parent etc */
    GenerateEntityRow(entId: number): HTMLDivElement {
        const entData = this.ecosystem.entitySystem.GetEntityData(entId);
        //Basic items
        const row = this.ecosystem.doc.createElement("div");
        this.generatedEntityRows[entId] = row;
        row.style.marginTop = "2px";
        row.classList.add("higherarchyEntity");
        const entityId = this.ecosystem.doc.createElement("p");
        this.setEntityName(row,entData);
        entityId.classList.add("higherarchEntityText");
        row.appendChild(entityId);
        this.higherarchyItems.appendChild(row);
        this.setEntRowInset(row, entId);

        //View Entity components etc
        row.addEventListener("click", async () => {
            this.setupInspectorForEntity(entId);
            row.classList.add("selectedHigherarchy");
            SetInspectorOwner(row);
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
                            if (this.ecosystem.doc.defaultView.confirm("Delete Entity " + entId + "?")) {
                                row.remove();
                                this.ecosystem.entitySystem.RemoveEntity(entId);
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

    private setEntRowInset(row: HTMLDivElement, entId: number) {
        row.style.marginLeft = ((this.GetPrefabInsetLevel(this.ecosystem.entitySystem.GetEntityData(entId)) * 5)).toString() + "%";
    }

    RemoveEntityRow(entId:number) {
        this.RegenerateHigherarchy();
    }

    protected GetPrefabInsetLevel(entity: EntityData): number {
        var pf = entity.GetComponent(Prefab);
        if(pf !== undefined) {
            var insetLevel = 0;
            while(pf.parent !== undefined) {
                insetLevel++;
                pf = pf.parent.GetComponent<Prefab>(Prefab);
            }
            return insetLevel;
        }
        return 0;
    }

    protected addNewEntity(): number {
        return this.ecosystem.entitySystem.AddEntityAtAnyEmptySlot().EntityId;
    }

    addComponentToEntity(entityId: number, compType: storedRegisteredType): boolean {
        const entity = this.ecosystem.entitySystem.GetEntityData(entityId);
        if (entity.GetComponentByName(compType.type.name) !== undefined) {
            return true;
        }

        //Set component as added
        const spawnType =compType.type;
        //@ts-ignore
        const newComp = new spawnType();
        this.ecosystem.entitySystem.AddSetComponentToEntity(entityId,newComp);
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
        if(entityId !== undefined) {
            this.currrentInspector = new EntityInspectorHTML(this, entityId);
        }
        RemoveClassFromAllItems("selectedHigherarchy", this.higherarchyItems);
        this.onEntitySelected.notifyObservers(this.ecosystem.entitySystem.GetEntityData(entityId));
    }
}
