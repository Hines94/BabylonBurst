
import { AsyncImageDescription } from "@BabylonBurstClient/AsyncAssets/index";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { GetFullNameOfObject } from "../ContentItem";

export class ContentBrowserImageHTML extends ContentBrowserItemHTML {
    protected performPrimaryMethod(): void {}

    protected override async drawInspectorInfo(): Promise<boolean> {
        if ((await super.drawInspectorInfo()) === false) {
            return false;
        }
        const inspector = document.getElementById("InspectorPanel") as HTMLElement;
        const image = inspector.querySelector("#ItemImage") as HTMLImageElement;
        this.setImage(image);
    }

    async setImage(element: HTMLImageElement) {
        const ourPath = GetFullNameOfObject(this.ourItem).replace(".zip", "");
        const asyncImageItem = new AsyncImageDescription(ourPath);
        const imgData = await asyncImageItem.GetImageAsBase64();
        element.src = imgData;
    }
}
