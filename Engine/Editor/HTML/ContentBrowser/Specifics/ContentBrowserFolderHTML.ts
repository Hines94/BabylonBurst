import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { ContentItemType, GetAllParentLevels } from "../ContentItem";

export class ContentBrowserFolderHTML extends ContentBrowserItemHTML {
    protected performPrimaryMethod(): void {
        this.openFolder();
    }

    protected override getContextMenuItems(): {
        name: string;
        callback: () => void;
    }[] {
        return [
            {
                name: "Open",
                callback: () => {
                    this.openFolder();
                },
            },
        ].concat(super.getContextMenuItems());
    }

    protected override contextMenuDelete(): void {
        var result = window.confirm(
            "Really delete " +
                this.ourItem.readableName +
                " AND all " +
                this.getAllContainedAssets().length +
                " assets inside " +
                "?"
        );
        if (result) {
            this.DeleteItem();
        }
    }

    protected override DeleteItem(): Promise<void> {
        //Delete all contained items
        const allcontained = this.getAllContainedAssets();
        allcontained.forEach(asset => {
            this.ourContentHolder.storageBackend.requestDelete(asset);
        });
        return super.DeleteItem();
    }

    protected override async drawInspectorInfo(): Promise<boolean> {
        if ((await super.drawInspectorInfo()) === false) {
            return false;
        }
        const inspector = this.ourDiv.ownerDocument.getElementById("InspectorPanel") as HTMLElement;

        const containedItems = this.getAllContainedAssets();

        //Total num assets
        const numItems = this.ourDiv.ownerDocument.createElement("p");
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
            const typeItem = this.ourDiv.ownerDocument.createElement("p");
            typeItem.style.padding = "0px";
            typeItem.style.margin = "0px";
            typeItem.style.paddingLeft = "20px";
            typeItem.style.color = "lightgray";
            typeItem.innerText = ContentItemType[types[i] as any] + " : " + containedTypes[types[i] as any];
            inspector.appendChild(typeItem);
        }

        //Size
        const containedSize = this.ourDiv.ownerDocument.createElement("p");
        containedSize.innerText = "Assets Size: " + totalSize.toFixed(2) + "mb";
        containedSize.style.paddingTop = "20px";
        inspector.appendChild(containedSize);

        //Children number
        // const directChild = document.createElement('p');
        // directChild.innerText = "Direct Children: " + Object.keys(this.ourItem.containedItems).length;
        // inspector.appendChild(directChild);
    }

    openFolder() {
        this.ourContentHolder.storageBackend.currentFolderLevel = GetAllParentLevels(this.ourItem).concat([
            this.ourItem,
        ]);
        this.ourContentHolder.rebuildStoredItems();
    }
}
