
import { AsyncAudioClipDefinition } from "../../../../../AsyncAssets";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { GetFullNameOfObject } from "../ContentItem";

export class ContentBrowserAudioClipHTML extends ContentBrowserItemHTML {
    protected performPrimaryMethod(): void {
        this.playAudioSound();
    }

    protected override getContextMenuItems(): {
        name: string;
        callback: () => void;
    }[] {
        return [
            {
                name: "Play",
                callback: () => {
                    this.performPrimaryMethod();
                },
            },
        ].concat(super.getContextMenuItems());
    }

    async playAudioSound() {
        if (this.ourItem.data) {
            return;
        }
        //TODO: Set data
        const clip = new AsyncAudioClipDefinition(GetFullNameOfObject(this.ourItem).replace(".zip", ""));
        clip.GetSoundInstance(this.ourContentHolder.ecosystem.scene, {
            loop: false,
            autoplay: true,
        });
    }

    protected override async drawInspectorInfo(): Promise<boolean> {
        if ((await super.drawInspectorInfo()) === false) {
            return false;
        }
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
