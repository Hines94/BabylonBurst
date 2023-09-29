import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentBrowserVisualHTML } from "../ContentBrowserVisualHTML";
import { AssetBundle } from "../AssetBundle";
import { GetContentItemHTMLSpecific } from "../ContentItemTypes";
import { MakeDraggableElement, MakeDroppableGenericElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentItem } from "../ContentItem";


export class ContentBrowserAssetBundleHTML extends ContentBrowserVisualHTML {

    ourItem: AssetBundle;
    containedIcons:ContentBrowserVisualHTML[] = [];

    setupOurSelectable(): void {
        this.ourSelectable = document.createElement('div');
        this.ourSelectable.classList.add('asset-bundle');
        this.ourContentHolder.contentGrid.appendChild(this.ourSelectable);
        this.ourName = document.createElement('input');
        this.ourName.classList.add('ContentItemName');
        this.ourName.style.verticalAlign = "top";
        this.ourName.style.overflow = 'visible';
        this.ourName.style.pointerEvents = 'none';
        this.ourSelectable.appendChild(this.ourName);
        this.regenerateContainedItems();
        MakeDroppableGenericElement(this.ourSelectable,this.onItemDropped.bind(this),this.canItemBeDropped.bind(this));
        MakeDraggableElement(this.ourSelectable,()=>{return ""});
        (this.ourSelectable as any).AssetBundle = this.ourItem;
    }

    canItemBeDropped(DraggedElement:EventTarget) {
        const item = (DraggedElement as any).contentItem as ContentItem;
        if(item === undefined) {
            return false;
        }
        if(item.parent === this.ourItem) {
            return false;
        }
        return true;
    }

    onItemDropped(DraggedElement:EventTarget) {
        const item = (DraggedElement as any).contentItem as ContentItem;
        if(item) {
            if(this.ourItem.GetItemByName(item.name) !== undefined) {
                alert(`Can't add item as already exists in bundle: ${item.name}`);
                return;
            }
            if(confirm(`Swap asset from ${item.parent.name} to ${this.ourItem.name}?`)) {
                this.ourItem.MoveItemIntoThisBundle(item);
            }
        }
    }

    async regenerateContainedItems() {
        if(this.ourItem.refreshPromise) {
            await this.ourItem.refreshPromise;
        }
        if(this.containedIcons) {
            this.containedIcons.forEach(i=>{
                i.CleanupItem();
            })
        }
        this.containedIcons = [];
        this.ourItem.storedItems.forEach(si=>{
            const newItem = GetContentItemHTMLSpecific(si,this.ourContentHolder);
            this.ourSelectable.appendChild(newItem.ourItemContainer);
            this.containedIcons.push(newItem);
        })
        if(this.containedIcons.length < 11) {
            const itemNum = (this.containedIcons.length + 1).toFixed(0);
            this.ourSelectable.style.gridColumn = `span ${itemNum}`;
            this.ourSelectable.style.gridTemplateColumns = `repeat(${itemNum}, 1fr)`
        }
    }


    async itemNameChange(): Promise<boolean> {
        //Check no other asset bundles have same name
        for(var i = 0; i < this.ourItem.parent.containedItems.length; i++) {
            if(this.ourItem.parent.containedItems[i].name === this.ourName.value) {
                alert("Error: Tried to rename but already existing bundle with same name: " + this.ourName.value);
                return;
            }
        }
        this.ourItem.updateStoredItemsData();
        this.ourItem.DeleteItem();

        this.ourItem.name = this.ourName.value;
        return await this.ourItem.SaveItemOut();
    }
    getContextMenuItems(): ContextMenuItem[] {
        const bundle = this;
        return [
            {
                name:"Clone",
                callback:async ()=>
                {
                    await bundle.ourItem.CloneBundle();
                    bundle.ourContentHolder.rebuildStoredItems();
                }
            }
        ];
    }
    async attemptDeletion(): Promise<boolean> {
        if(!confirm(`Really delete ${this.ourItem.name}.zip and the ${this.ourItem.storedItems.length} items contained inside?`)) {
            return;
        }
        if(!await this.ourItem.DeleteItem()){
            return false;
        }
        this.ourItem.parent.containedItems = this.ourItem.parent.containedItems.filter(i=>i !== this.ourItem);
        this.ourContentHolder.rebuildStoredItems();
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = "Asset Bundle";
        (inspector.querySelector("#ItemSize") as HTMLElement).innerText = "Size: " + (this.ourItem.size/1000000).toFixed(2) + "mb";
    }
    performPrimaryMethod(): void {

    }
    cleanupItem(): void {

    }

}