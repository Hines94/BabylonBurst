import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentItem } from "../ContentItem";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { AsyncAudioClipDefinition } from "@engine/AsyncAssets";

export class ContentBrowserAudioClipHTML extends ContentBrowserSpecificItem {
    cleanupItem(): void {
        throw new Error("Method not implemented.");
    }

    performPrimaryMethod(): void {
        this.playAudioSound();
    }

    override getContextMenuItems(): ContextMenuItem[] {
        return super.getContextMenuItems().concat([
            {
                name: "Play",
                callback: () => {
                    this.performPrimaryMethod();
                },
            },
        ]);
    }

    async playAudioSound() {
        if (this.ourItem.data) {
            return;
        }
        //TODO: Set data
        const clip = new AsyncAudioClipDefinition(this.ourItem.parent.getItemLocation(), this.ourItem.GetSaveName());
        const instance = clip.GetSoundInstance(this.ourContentHolder.ecosystem.scene, {
            loop: false,
            autoplay: true,
        });
    }

    override async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        const playB = this.ourContentHolder.ecosystem.doc.createElement("button");
        playB.innerText = "Play";
        inspector.appendChild(playB);
        const audb = this;
        playB.addEventListener("click", () => {
            audb.playAudioSound();
        });
    }
}
