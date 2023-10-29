import { HigherarchyHTML } from "./HigherarchyHTML";
import { ContentItem } from "../ContentBrowser/ContentItem";
import { OpenNewWindow } from "@BabylonBurstClient/HTML/HTMLWindowManager";
import { WaitForEvent } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentStorageBackend } from "../ContentBrowser/ContentBrowserHTML";
import { AddOptionToEditorTopMenu } from "../../Utils/EditorTopMenu";
import { decode, encode } from "@msgpack/msgpack";
import { EntitySaver } from "@engine/EntitySystem/EntitySaver";
import {Prefab, PrefabPackedType} from "@engine/EntitySystem/Prefab"
import { PrefabManager } from "@engine/EntitySystem/PrefabManager";
import { SetupAllTopBarOptions } from "../HTMLUtils/TopBarSetup";
import { EntNamingComponent } from "@engine/EntitySystem/CoreComponents";

/** Used for specifically loading prefabs into a seperate window */
export class PrefabHigherarchyHTML extends HigherarchyHTML {
    /** Included as "PrefabId" in prefab json data */
    prefabUUID: string;

    async LoadPrefabIntoHigherarchy(prefab: ContentItem, storageBackend: ContentStorageBackend) {
        const higherarchy = this;

        this.Displayer = OpenNewWindow(
            "PrefabWindows_" + prefab.name,
            "EditorSections/PrefabDisplayer",
            prefab.name
        );
        if (!this.Displayer) {
            return;
        }

        this.windowDoc = this.Displayer.window.document;
        await WaitForEvent("PrefabDisplayerSetup", this.windowDoc);
        this.setupEditorPanel();
        this.windowDoc.getElementById("ContentBrowser").remove(); //TODO: if it becomes useful again show

        //Setup new game ecosystem so we can render any prefab items
        this.setupHigherarchyEcosystem();

        //Load new prefab
        var prefabData:PrefabPackedType;
        if(prefab.data !== null) {
            prefabData = decode(prefab.data) as PrefabPackedType;
        }
        this.prefabUUID = prefabData.prefabID;
        (this.higherarchPanel.querySelector("#HigherarchTitle") as HTMLElement).innerText = prefab.name;

        await this.ecosystem.waitLoadedPromise;

        setupTopMenu();

        this.ecosystem.entitySystem.ResetSystem();
        PrefabManager.LoadPrefabFromIdToExisting(prefabData.prefabID,this.ecosystem.entitySystem);
        console.log("------------ Loading Prefab Data ------------");
        console.log(PrefabManager.GetPrefabTemplateById(prefabData.prefabID))
        console.log(higherarchy.ecosystem.entitySystem.GetEntitiesWithData([],[]).GetEntitiesArray());
        console.log("------------ End Loading Prefab Data ------------");
        this.RegenerateHigherarchy();
        this.setupRightClick();

        //Show higherarchy panel
        this.higherarchPanel.classList.remove("hidden");

        //Prefab specific - with save/exit etc
        function setupTopMenu() {
            //Save button
            const saveEntButton = AddOptionToEditorTopMenu(higherarchy.ecosystem, "File", "Save Prefab",-1);
            saveEntButton.addEventListener("click", () => {
                const saveData: PrefabPackedType = {
                    prefabID: higherarchy.prefabUUID,
                    prefabData: EntitySaver.GetMsgpackForAllEntities(higherarchy.ecosystem.entitySystem,true),
                };

                console.log("------------ Saving Prefab Data ------------");
                console.log(decode(saveData.prefabData));
                prefab.data = encode(saveData);
                console.log("------------- End Prefab Data -------------");

                //Save to backend
                prefab.SaveItemOut();
                //Reset for each current WASM system
                PrefabManager.SetupPrefabFromRaw(prefab.parent.getItemLocation(),prefab.GetSaveName(),prefab.data);
                ShowToastNotification("Entity Saved", 3000, higherarchy.windowDoc);
            });
            //Exit button
            const exitButton = AddOptionToEditorTopMenu(higherarchy.ecosystem, "File", "Exit",-1);
            exitButton.addEventListener("click", () => {
                if (higherarchy.ecosystem.doc.defaultView.confirm("Close Prefab Editing")) {
                    higherarchy.Displayer.window.close();
                }
            });

            SetupAllTopBarOptions(higherarchy.ecosystem,{},{},{bContentBrowserOption:false})
        }
    }

    protected override setupContextMenu(event: MouseEvent): void {
        ShowContextMenu(
            event,
            [
                {
                    name: "New Entity",
                    callback: () => {
                        this.addNewEntity();
                        this.RegenerateHigherarchy();
                    },
                },
            ],
            this.Displayer.window.document
        );
    }

    protected override addNewEntity(): number {
        const added = super.addNewEntity();
        const prefabData = new Prefab();
        prefabData.PrefabIdentifier = this.prefabUUID;
        prefabData.EntityIndex = added;
        this.ecosystem.entitySystem.AddSetComponentToEntity(added,prefabData);
        const namingComp = new EntNamingComponent();
        this.ecosystem.entitySystem.AddSetComponentToEntity(added,namingComp);
        return added;
    }

    override RegenerateHigherarchy(): void {
        super.RegenerateHigherarchy();
    }
}
