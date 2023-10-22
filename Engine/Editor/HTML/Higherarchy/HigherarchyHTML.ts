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

/** Can display entities in a higherarchy with clickable options (delete/add etc). Also hooks into inspector. */
export abstract class HigherarchyHTML {
    higherarchyItems: HTMLElement;
    Displayer: { loadingElement: Promise<HTMLDivElement>; window: Window };
    windowDoc: Document;
    inspector: HTMLElement;
    higherarchPanel: HTMLElement;
    contentOptions: HTMLElement;
    ecosystem: BabylonBurstEditor;
    generatedEntityRows: { [entId: number]: HTMLDivElement } = {};

    setEcosystem(ecosystem:GameEcosystem) {
        this.ecosystem = ecosystem as BabylonBurstEditor;
        ecosystem.entitySystem.onEntityCreatedEv.add(this.GenerateEntityRow.bind(this));
        ecosystem.entitySystem.onEntityRemovedEv.add(this.RemoveEntityRow.bind(this));
        SetupEditorGizmos(ecosystem);
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

    /** Entity row on higherarchy that lets us select and TODO: re-parent etc */
    GenerateEntityRow(entId: number): HTMLDivElement {
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
        row.style.marginLeft = ((this.GetPrefabInsetLevel(this.ecosystem.entitySystem.GetEntityData(entId)) * 10)+5).toString() + "%";

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
                            if (this.windowDoc.defaultView.confirm("Delete Entity " + entId + "?")) {
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

    RemoveEntityRow(entId:number) {
        this.RegenerateHigherarchy();
    }

    protected GetPrefabInsetLevel(entity: EntityData): number {
        const pf = entity.GetComponent(Prefab);
        if(pf) {
            //TODO: Trace up for this?
            if(pf.parent) {
                return 1;
            }
        }
        return 0;
    }

    protected addNewEntity(): number {
        return this.ecosystem.entitySystem.AddEntityAtAnyEmptySlot().EntityId;
    }

    addComponentToEntity(entityId: number, compType: storedRegisteredType, allEntComps: HTMLElement): boolean {
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
        this.ecosystem.onEntitySelected.notifyObservers(this.ecosystem.entitySystem.GetEntityData(entityId));
    }
}
