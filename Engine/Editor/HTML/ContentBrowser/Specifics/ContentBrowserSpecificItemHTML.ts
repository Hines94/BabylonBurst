import { ContentItem, ContentItemType } from "../ContentItem";
import { ContentBrowserIconedItemHTML } from "./ContentBrowserIconedItemHTML";


export abstract class ContentBrowserSpecificItem extends ContentBrowserIconedItemHTML {
    ourItem:ContentItem;

    getDraggingText(): string {
        return this.ourItem.name;
    }

    attemptDeletion(): void {
        throw new Error("Method not implemented.");
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = ContentItemType[this.ourItem.category];
    }

    override setupOurSelectable(): void {
        super.setupOurSelectable();
        this.SetIcon(ContentItemType[this.ourItem.category]);
    }

    protected async createClone() {
        console.error("TODO: Create clone base!")
        // const newItem: any = {};
        // const existItemKeys = Object.keys(this.ourItem);
        // for (var i = 0; i < existItemKeys.length; i++) {
        //     const key = existItemKeys[i];
        //     //@ts-ignore
        //     newItem[key] = this.ourItem[key];
        // }

        // newItem.readableName = GetNewNameItem(this.ourItem.parent.storedItems, "_Clone");
        // this.ourContentHolder.addNewItem(newItem);
    }
}