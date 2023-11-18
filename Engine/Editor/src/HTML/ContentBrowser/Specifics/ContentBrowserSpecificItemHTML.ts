import { MakeDraggableElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentItem, ContentItemType } from "../ContentItem";
import { ContentBrowserIconedItemHTML } from "./ContentBrowserIconedItemHTML";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ShowNotificationWindow } from "@BabylonBurstClient/HTML/HTMLNotificationWindow";
import { AssetBundle } from "../AssetBundle";
import { SetupBundleInputWithDatalist } from "../../../Utils/ContentTypeTrackers";
import { CopyToClipboard } from "@BabylonBurstClient/Utils/HTMLUtils";

export abstract class ContentBrowserSpecificItem extends ContentBrowserIconedItemHTML {
    declare ourItem: ContentItem;

    getDraggingText(): string {
        return this.ourItem.name;
    }

    async itemNameChange(): Promise<boolean> {
        if (this.ourName.value === this.ourItem.name) {
            return;
        }
        //Check name not already taken
        for (var i = 0; i < this.ourItem.parent.storedItems.length; i++) {
            if (this.ourItem.parent.storedItems[i].name === this.ourName.value) {
                alert("Name has already been taken in asset bundle: " + this.ourName.value);
                this.ourName.value = this.ourItem.name;
                return false;
            }
        }
        //Rename
        await this.ourItem.parent.updateStoredItemsData();
        this.ourItem.name = this.ourName.value;
        return await this.ourItem.SaveItemOut();
    }

    async attemptDeletion(): Promise<boolean> {
        if (!(await this.ourItem.DeleteItem())) {
            return false;
        }
        this.ourContentHolder.rebuildStoredItems();
        return true;
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = ContentItemType[this.ourItem.category];
        if (this.ourItem.size !== undefined) {
            (inspector.querySelector("#ItemSize") as HTMLElement).innerText =
                "Size: " + (this.ourItem.size / 1000000).toFixed(2) + "mb";
        }
        this.SetIcon(ContentItemType[this.ourItem.category], inspector.querySelector("#ItemImage"));

        const fullPath = inspector.ownerDocument.createElement("p");
        fullPath.innerText = this.ourItem.GetSaveName();
        inspector.appendChild(fullPath);

        const copyButton = inspector.ownerDocument.createElement("button");
        copyButton.innerText = "Copy Filename";
        copyButton.addEventListener("click", () => {
            CopyToClipboard(this.ourItem.GetSaveName());
        });
        inspector.appendChild(copyButton);
    }

    override setupOurSelectable(): void {
        super.setupOurSelectable();
        this.SetIcon(ContentItemType[this.ourItem.category]);
        MakeDraggableElement(this.ourSelectable, () => {
            return "item";
        });
        (this.ourSelectable as any).contentItem = this.ourItem;
    }
    override getContextMenuItems(): ContextMenuItem[] {
        return [
            {
                name: "Change Bundle",
                callback: async () => {
                    const window = ShowNotificationWindow(this.ourContentHolder.ecosystem.doc);
                    const title = this.ourContentHolder.ecosystem.doc.createElement("h3");
                    title.innerText = "Change asset bundle for: " + this.ourItem.name;
                    window.appendChild(title);
                    const dropdown = this.ourContentHolder.ecosystem.doc.createElement("input");
                    var desiredMove: AssetBundle;
                    SetupBundleInputWithDatalist(dropdown, fold => {
                        desiredMove = fold;
                    });
                    dropdown.style.display = "block";
                    dropdown.style.width = "100%";
                    window.appendChild(dropdown);
                    const confirm = this.ourContentHolder.ecosystem.doc.createElement("button");
                    confirm.style.display = "block";
                    confirm.innerText = "Confirm";
                    confirm.addEventListener("click", async () => {
                        if (desiredMove === undefined) {
                            return;
                        }
                        if (desiredMove.GetItemByName(this.ourItem.name)) {
                            alert("Already asset with name in bundle: " + this.ourItem.name);
                            return;
                        }
                        await desiredMove.MoveItemIntoThisBundle(this.ourItem);
                        this.ourContentHolder.rebuildStoredItems();
                        window.parentElement.classList.remove("visible");
                    });
                    window.appendChild(confirm);
                },
            },
        ];
    }

    protected async createClone() {
        console.error("TODO: Create clone base!");
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
