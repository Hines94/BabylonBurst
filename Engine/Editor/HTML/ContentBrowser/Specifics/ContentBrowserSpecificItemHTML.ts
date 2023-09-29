import { MakeDraggableElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentItem, ContentItemType } from "../ContentItem";
import { ContentBrowserIconedItemHTML } from "./ContentBrowserIconedItemHTML";


export abstract class ContentBrowserSpecificItem extends ContentBrowserIconedItemHTML {
    ourItem:ContentItem;

    getDraggingText(): string {
        return this.ourItem.name;
    }

    async itemNameChange(): Promise<boolean> {
        if(this.ourName.value === this.ourItem.name) {
            return;
        }
        //Check name not already taken
        for(var i = 0; i < this.ourItem.parent.storedItems.length;i++) {
            if(this.ourItem.parent.storedItems[i].name === this.ourName.value) {
                alert("Name has already been taken in asset bundle: " + this.ourName.value);
                this.ourName.value = this.ourItem.name;
                return false;
            }
        }
        //Rename
        this.ourItem.name = this.ourName.value;
        return await this.ourItem.SaveItemOut();
    }

    async attemptDeletion(): Promise<boolean> {
        if(!await this.ourItem.DeleteItem()){
            return false;
        }
        this.ourContentHolder.rebuildStoredItems();
        return true;
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = ContentItemType[this.ourItem.category];
        if(this.ourItem.size !== undefined) {
            (inspector.querySelector("#ItemSize") as HTMLElement).innerText = "Size: " + (this.ourItem.size/1000000).toFixed(2) + "mb";
        }
        this.SetIcon(ContentItemType[this.ourItem.category],inspector.querySelector("#ItemImage"));
    }

    override setupOurSelectable(): void {
        super.setupOurSelectable();
        this.SetIcon(ContentItemType[this.ourItem.category]);
        MakeDraggableElement(this.ourSelectable,()=>{return "item"; });
        (this.ourSelectable as any).contentItem = this.ourItem;
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