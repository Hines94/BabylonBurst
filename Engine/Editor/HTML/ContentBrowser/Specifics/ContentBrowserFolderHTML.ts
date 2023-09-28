import { ContentBrowserIconedItemHTML } from "./ContentBrowserIconedItemHTML";
import { ContentBrowserHTML } from "../ContentBrowserHTML";
import { AssetFolder } from "../AssetFolder";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentItemType } from "../ContentItem";

export class ContentBrowserFolderHTML extends ContentBrowserIconedItemHTML {
    ourFolder:AssetFolder;
    ourItem:AssetFolder;
    
    constructor(ourContentHolder: ContentBrowserHTML, folder: AssetFolder) {
        super(ourContentHolder,folder);
        this.ourFolder = folder;

        this.SetIcon("Folder");
    }

    override setupOurSelectable(): void {
        super.setupOurSelectable();
        this.ourContentHolder.contentGrid.appendChild(this.ourItemContainer);
    }

    cleanupItem(): void {
        console.log("TODO: Cleanup!");
    }

    getDraggingText(): string {
        return this.ourFolder.GetFullFolderPath();
    }

    getContextMenuItems(): ContextMenuItem[] {
        return [
        ]
    }

    attemptDeletion(): void {
        var result = window.confirm(
            "Really delete " +
                this.ourItem.name +
                " AND all " +
                this.ourItem.getAllContainedAssets().length +
                " assets inside " +
                "?"
        );
        if (result) {
            this.ourItem.DeleteItem();
        }
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourItemContainer.ownerDocument.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = "Folder";
        this.SetIcon("Folder",inspector.querySelector("#ItemImage"));

        const containedItems = this.ourItem.getAllContainedAssets();

        //Total num assets
        const numItems = this.ourItemContainer.ownerDocument.createElement("p");
        numItems.innerText = "Num Contained Assets: " + containedItems.length;
        numItems.style.paddingBottom = "0px";
        numItems.style.marginBottom = "0px";
        inspector.appendChild(numItems);

        //Get types of items
        var totalSize = 0;
        const containedTypes: { [id: number]: number } = {};
        for (var i = 0; i < containedItems.length; i++) {
            if (containedTypes[containedItems[i].category] === undefined) {
                containedTypes[containedItems[i].category] = 0;
            }
            containedTypes[containedItems[i].category] += 1;
            if (containedItems[i].size) {
                totalSize += containedItems[i].size / 1000000;
            }
        }
        const types = Object.keys(containedTypes);
        for (var i = 0; i < types.length; i++) {
            const typeItem = this.ourItemContainer.ownerDocument.createElement("p");
            typeItem.style.padding = "0px";
            typeItem.style.margin = "0px";
            typeItem.style.paddingLeft = "20px";
            typeItem.style.color = "lightgray";
            typeItem.innerText = ContentItemType[types[i] as any] + " : " + containedTypes[types[i] as any];
            inspector.appendChild(typeItem);
        }

        //Size
        (inspector.querySelector("#ItemSize") as HTMLElement).innerText =
                "Size: " + (totalSize).toFixed(2) + "mb";

        //Children number
        // const directChild = document.createElement('p');
        // directChild.innerText = "Direct Children: " + Object.keys(this.ourItem.containedItems).length;
        // inspector.appendChild(directChild);
    }

    performPrimaryMethod(): void {
        this.ourContentHolder.storageBackend.currentFolderLevel = this.ourFolder.GetAllParentFolders().concat([this.ourFolder]);
        this.ourContentHolder.rebuildStoredItems();
    }

}