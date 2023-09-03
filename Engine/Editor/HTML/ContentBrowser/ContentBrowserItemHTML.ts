import { ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { CloneTemplate, GetNewNameItem, MakeDraggableElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { GetInspectorOwner, SetInspectorOwner } from "../InspectorWindow/InspectorHTML";
import { ContentBrowserHTML } from "./ContentBrowserHTML";
import {
    ContentItem,
    ContentItemType,
    GetContentItemNameInclType,
    GetFullNameOfObject,
    SaveContentItem,
} from "./ContentItem";

const icons: { [type: number]: string } = {};
const iconPromises: { [type: number]: Promise<void> } = {};

export abstract class ContentBrowserItemHTML {
    ourItem: ContentItem;
    ourDiv: HTMLElement;
    ourName: HTMLInputElement;
    ourContentHolder: ContentBrowserHTML;
    ourSelectable: HTMLElement;

    constructor(item: ContentItem, div: HTMLElement, ourContentHolder: ContentBrowserHTML) {
        this.ourItem = item;
        this.ourDiv = div;
        this.ourContentHolder = ourContentHolder;
        this.ourSelectable = div.querySelector("#selectableContentItem");
        MakeDraggableElement(this.ourSelectable, () => {
            return GetFullNameOfObject(this.ourItem).replace(".zip", "");
        });
        if (this.ourContentHolder.autoselectItem === this.ourItem) {
            this.ourSelectable.classList.add("selectedContent");
            this.drawInspectorInfo();
        }
        this.ourSelectable.addEventListener("click", () => {
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.performPrimaryMethod();
            } else {
                this.ourContentHolder.unclickAllItems();
                this.ourSelectable.classList.add("selectedContent");
            }
        });
        this.ourSelectable.addEventListener("contextmenu", event => {
            this.ourContentHolder.unclickAllItems();
            this.ourSelectable.classList.add("selectedContent");
            ShowContextMenu(event, this.getContextMenuItems(), this.ourDiv.ownerDocument);
        });
        this.setItemName();
        this.setIcon(this.ourDiv.querySelector("#ContentItemThumbnail"));
        this.bindForKeypress();
        this.bindForClassChanges();
    }

    protected itemNameChange(event: Event) {
        this.ourContentHolder.storageBackend.requestDelete(this.ourItem);
        const inputValue: string = this.ourName.value;
        this.ourName.blur();
        this.ourItem.readableName = inputValue;
        this.SaveItem();
        this.drawInspectorInfo();
    }

    private handleKeypress(event: any) {
        if (event.key === "F2") {
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.ourName.focus();
                event.preventDefault();
            }
        }
        if (event.key === "Delete") {
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.contextMenuDelete();
                event.preventDefault();
            }
        }
    }

    boundKeyFunc: any;
    protected bindForKeypress() {
        this.boundKeyFunc = this.handleKeypress.bind(this);
        this.ourDiv.ownerDocument.addEventListener("keydown", this.boundKeyFunc);
    }

    protected async setIcon(iconImg: HTMLImageElement) {
        if (icons[this.ourItem.category] !== undefined) {
            iconImg.src = icons[this.ourItem.category];
            return;
        }
        if (!iconPromises[this.ourItem.category]) {
            iconPromises[this.ourItem.category] = this.FetchIcon();
        }
        await iconPromises[this.ourItem.category];
        iconImg.src = icons[this.ourItem.category];
    }

    private async FetchIcon(): Promise<void> {
        const response = await fetch("EditorIcons/" + ContentItemType[this.ourItem.category] + "Icon.png");
        if (!response.ok) {
            return;
        }
        const blob = await response.blob();
        const imageURL = URL.createObjectURL(blob);
        icons[this.ourItem.category] = imageURL;
        iconPromises[this.ourItem.category] = undefined;
    }

    protected setItemName() {
        this.ourName = this.ourDiv.querySelector("#ContentItemName") as HTMLInputElement;
        this.ourName.addEventListener("change", this.itemNameChange.bind(this));
        this.ourName.value = this.ourItem.readableName;
    }

    protected getContextMenuItems() {
        return [
            {
                name: "Rename",
                callback: () => {
                    this.ourName.focus();
                },
            },
            {
                name: "Delete",
                callback: () => {
                    this.contextMenuDelete();
                },
            },
        ];
    }

    protected SaveItem() {
        //Save to JS representation
        this.ourItem.parent.containedItems[this.ourItem.readableName] = this.ourItem;
        //Send data to S3
        this.ourContentHolder.storageBackend.saveItem(this.ourItem);
    }

    protected contextMenuDelete() {
        var result = window.confirm("Really delete " + this.ourItem.readableName + "?");
        if (result) {
            this.DeleteItem();
        }
    }

    protected async DeleteItem() {
        const del = await this.ourContentHolder.storageBackend.requestDelete(this.ourItem);
        if (!del) {
            console.error("Error deleting item: " + this.ourName.value);
            return;
        }
        const oldKey = GetContentItemNameInclType(this.ourItem);
        delete this.ourItem.parent.containedItems[oldKey];
        this.cleanupItem();
        ShowToastNotification("Deleted item: " + this.ourItem.readableName);
    }

    /** When we are no longer needed or deleted */
    cleanupItem() {
        if (this.boundKeyFunc) {
            this.ourDiv.ownerDocument.removeEventListener("keydown", this.boundKeyFunc);
            this.boundKeyFunc = undefined;
        }
        if (this.classChangeObserver) {
            this.classChangeObserver.disconnect();
        }
        if (this.ourSelectable.classList.contains("selectedContent")) {
            this.hideInspectorInfo();
        }
        this.ourDiv.remove();
    }

    protected abstract performPrimaryMethod(): void;

    getAllContainedAssets(): ContentItem[] {
        return recursiveGetAssets(this.ourItem).filter(item => item != this.ourItem);
    }

    classChangeObserver: MutationObserver;
    private bindForClassChanges() {
        const browserItem = this;
        // Create an instance of MutationObserver
        this.classChangeObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === "class") {
                    if (browserItem.ourSelectable.classList.contains("selectedContent")) {
                        browserItem.drawInspectorInfo();
                    } else {
                        browserItem.hideInspectorInfo();
                    }
                }
            });
        });

        // Configuration of the observer
        var config = { attributes: true, attributeFilter: ["class"] };

        // Pass in the target element and observer configuration
        this.classChangeObserver.observe(this.ourSelectable, config);
    }

    /** When we are selected - draw inspector information so we can  */
    protected async drawInspectorInfo(): Promise<boolean> {
        if (this.ourSelectable.classList.contains("selectedContent") === false) {
            return false;
        }
        const inspector = this.ourDiv.ownerDocument.getElementById("InspectorPanel") as HTMLElement;
        inspector.classList.remove("hidden");
        inspector.innerHTML = "";
        const basicInfo = CloneTemplate("BasicItemInspectorInfo");
        inspector.appendChild(basicInfo);
        (basicInfo.querySelector("#ItemName") as HTMLElement).innerText = this.ourItem.readableName;
        (basicInfo.querySelector("#ItemType") as HTMLElement).innerText = ContentItemType[this.ourItem.category];
        if (this.ourItem.size) {
            (basicInfo.querySelector("#ItemSize") as HTMLElement).innerText =
                "Size: " + (this.ourItem.size / 1000000).toFixed(2) + "mb";
        }
        const lastModified = basicInfo.querySelector("#LastModified") as HTMLElement;
        if (this.ourItem.lastModified) {
            lastModified.innerText = "Last Modified: " + formatDate(this.ourItem.lastModified);
        } else {
            lastModified.classList.add("hidden");
        }
        this.setIcon(basicInfo.querySelector("#ItemImage"));
        SetInspectorOwner(this);
        return true;
    }

    /** When we are unselected hide our inspection information */
    protected hideInspectorInfo() {
        if (GetInspectorOwner() !== this) {
            return;
        }
        const inspector = this.ourDiv.ownerDocument.getElementById("InspectorPanel") as HTMLElement;
        inspector.classList.add("hidden");
    }

    protected async createClone() {
        const newItem: any = {};
        const existItemKeys = Object.keys(this.ourItem);
        for (var i = 0; i < existItemKeys.length; i++) {
            const key = existItemKeys[i];
            //@ts-ignore
            newItem[key] = this.ourItem[key];
        }

        newItem.readableName = GetNewNameItem(this.ourItem.parent.containedItems, "_Clone");
        this.ourContentHolder.addNewItem(newItem);
    }
}

function recursiveGetAssets(item: ContentItem): ContentItem[] {
    var ret: ContentItem[] = [item];
    if (item.containedItems) {
        const keys = Object.keys(item.containedItems);
        for (var i = 0; i < keys.length; i++) {
            ret = ret.concat(recursiveGetAssets(item.containedItems[keys[i]]));
        }
    }
    return ret;
}

function formatDate(date: Date) {
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are 0-indexed in JavaScript
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
