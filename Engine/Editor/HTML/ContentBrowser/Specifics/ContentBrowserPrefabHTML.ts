import { AsyncArrayBufferLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";
import { PrefabHigherarchyHTML } from "../../Higherarchy/PrefabHigherarchyHTML";
import { decode } from "@msgpack/msgpack";
import { PrefabPackedType } from "@BabylonBurstClient/EntitySystem/PrefabPackedType";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";

export class ContentBrowserPrefabHTML extends ContentBrowserSpecificItem  {
    protected cleanupItem(): void {
        
    }
    performPrimaryMethod(): void {
        this.EnterPrefabInspection();
    }

    override getContextMenuItems(): {
        name: string;
        callback: () => void;
    }[] {
        return [
            {
                name: "Edit",
                callback: () => {
                    this.performPrimaryMethod();
                },
            },
            {
                name: "Clone",
                callback: () => {
                    alert("Not implemented yet");
                },
            },
        ];
    }

    /** Primary method for editing and inspecting a prefab */
    protected async EnterPrefabInspection() {
        await this.loadContent();
        const newHigherarch = new PrefabHigherarchyHTML();
        newHigherarch.LoadPrefabIntoHigherarchy(this.ourItem, this.ourContentHolder.storageBackend);
        this.ourSelectable.classList.remove("selectedContent");
    }

    protected async loadContent() {
        if (this.ourItem.data) {
            return;
        }
        const loader = new AsyncArrayBufferLoader(this.ourItem.parent.getItemLocation(), this.ourItem.name);
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }

    override async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        await this.loadContent();
        const prefabData = decode(this.ourItem.data) as PrefabPackedType;

        const pdiv = this.ourContentHolder.ecosystem.doc.createElement("p");
        pdiv.innerHTML = "PrefabUUID: <b>" + prefabData.prefabID + "</b>";
        inspector.appendChild(pdiv);

        const copyButton = this.ourContentHolder.ecosystem.doc.createElement("button");
        copyButton.innerText = "Copy";
        inspector.appendChild(copyButton);

        copyButton.addEventListener("click", async ev => {
            await navigator.clipboard.writeText(prefabData.prefabID);

            ShowToastNotification("Copied UUID", 3000, this.ourContentHolder.ecosystem.doc);
        });
    }
}
