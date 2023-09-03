import { AsyncArrayBufferLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { GetFullNameOfObject } from "../ContentItem";
import { PrefabHigherarchyHTML } from "../../Higherarchy/PrefabHigherarchyHTML";
import { decode } from "@msgpack/msgpack";
import { PrefabPackedType } from "@BabylonBurstClient/EntitySystem/PrefabPackedType";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";

export class ContentBrowserPrefabHTML extends ContentBrowserItemHTML {
    protected performPrimaryMethod(): void {
        this.EnterPrefabInspection();
    }

    protected override getContextMenuItems(): {
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
        ].concat(super.getContextMenuItems());
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
        const ourPath = GetFullNameOfObject(this.ourItem).replace(".zip", "");
        const loader = new AsyncArrayBufferLoader(ourPath, 0);
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }

    protected override async drawInspectorInfo(): Promise<boolean> {
        if ((await super.drawInspectorInfo()) === false) {
            return false;
        }
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
