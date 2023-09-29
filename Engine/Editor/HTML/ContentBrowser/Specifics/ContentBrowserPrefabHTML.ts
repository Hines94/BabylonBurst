import { AsyncArrayBufferLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";
import { PrefabHigherarchyHTML } from "../../Higherarchy/PrefabHigherarchyHTML";
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
        const loader = new AsyncArrayBufferLoader(this.ourItem.parent.getItemLocation(), this.ourItem.GetSaveName());
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }
}
