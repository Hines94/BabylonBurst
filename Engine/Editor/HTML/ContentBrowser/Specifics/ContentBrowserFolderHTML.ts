import { ContentBrowserIconedItemHTML } from "./ContentBrowserIconedItemHTML";
import { ContentBrowserHTML } from "../ContentBrowserHTML";
import { AssetFolder } from "../AssetFolder";
import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentItemType } from "../ContentItem";
import { MakeDroppableGenericElement } from "@BabylonBurstClient/HTML/HTMLUtils";

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
        (this.ourSelectable as any).AssetFolder = this.ourItem;
        this.ourContentHolder.contentGrid.appendChild(this.ourItemContainer);
        MakeDroppableGenericElement(this.ourSelectable,this.onElementDragover.bind(this),this.isDroppableElement.bind(this))
    }

    async onElementDragover(ele:any) {
        if(ele.AssetBundle !== undefined) {
            if(this.ourItem.GetBundleWithName(ele.AssetBundle.name)) {
                alert("This folder already has an item with that bundle name: " + ele.AssetBundle.name);
                return;
            }
            await this.ourItem.MoveAssetBundle(ele.AssetBundle);
            this.ourContentHolder.rebuildStoredItems();
        }
        if(ele.AssetFolder !== undefined) {
            if(this.ourItem.GetBundleWithName(ele.AssetFolder.name)) {
                alert("This folder already has an folder with that name: " + ele.AssetFolder.name);
                return;
            }
            await this.ourItem.MoveAssetFolder(ele.AssetFolder);
            this.ourContentHolder.rebuildStoredItems();
        }
    }

    isDroppableElement(ele:any) {
        if(ele.AssetBundle === undefined && ele.AssetFolder === undefined && ele.AssetFolder !== this.ourItem) {
            return false;
        }
        return true;
    }

    async itemNameChange(): Promise<boolean> {
        //Check that name change is valid
        for(var e=0; e < this.ourItem.parent.containedFolders.length;e++){
            if(this.ourItem.parent.containedFolders[e].name === this.ourName.value){
                alert("Existing folder with same name at level: " + this.ourName.value);
                return false;
            }
        }
        //Ensure all contained items have updated data
        const allcontainedItems = this.ourItem.getAllContainedBundles();
        for(var i = 0; i < allcontainedItems.length;i++) {
            await allcontainedItems[i].updateStoredItemsData();
        }
        //Delete all contained items
        for(var i = 0; i < allcontainedItems.length;i++) {
            await allcontainedItems[i].DeleteItem();
        }
        //Change name
        this.ourItem.name = this.ourName.value;
        //Save all contained items
        for(var i = 0; i < allcontainedItems.length;i++) {
            if(!await allcontainedItems[i].SaveItemOut()){
                console.error("Error saving our bundle for name change: " + allcontainedItems[i].name);
                return false;
            }
        }
        return true;
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

    async attemptDeletion(): Promise<boolean> {
        var result = window.confirm(
            "Really delete " +
                this.ourItem.name +
                " AND all " +
                this.ourItem.getAllContainedAssets().length +
                " assets inside " +
                "?"
        );
        if (result) {
            if(await this.ourItem.DeleteItem()){
                this.ourItem.parent.containedFolders = this.ourItem.parent.containedFolders.filter(i=>{return i !== this.ourItem});
                this.ourContentHolder.rebuildStoredItems();
                return true;
            }
        }
        return false;
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