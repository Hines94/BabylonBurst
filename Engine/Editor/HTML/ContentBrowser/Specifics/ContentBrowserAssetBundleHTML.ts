import { ContextMenuItem } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ContentBrowserVisualHTML } from "../ContentBrowserVisualHTML";
import { AssetBundle } from "../AssetBundle";
import { GetContentItemHTMLSpecific } from "../ContentItemTypes";
import { AsyncAWSBackend } from "@BabylonBurstClient/AsyncAssets";


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
        this.ourSelectable.appendChild(this.ourName);
        this.regenerateContainedItems();
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


    itemNameChange(): void {
        //Check no other asset bundles have same name
        for(var i = 0; i < this.ourItem.parent.containedItems.length; i++) {
            if(this.ourItem.parent.containedItems[i].name === this.ourName.value) {
                alert("Error: Tried to rename but already existing bundle with same name!");
                return;
            }
        }
        this.ourItem.DeleteItem();
        //TODO: Ensure we have data for all items!
        this.ourItem.name = this.ourName.value;
        this.ourItem.SaveItemOut();
    }
    getContextMenuItems(): ContextMenuItem[] {
        return [];
    }
    attemptDeletion(): void {
        if(!confirm(`Really delete ${this.ourItem.name}.zip and the ${this.ourItem.storedItems.length} items contained inside?`)) {
            return;
        }
        this.ourItem.DeleteItem();
        this.ourItem.parent.containedItems = this.ourItem.parent.containedItems.filter(i=>i !== this.ourItem);
        this.ourContentHolder.rebuildStoredItems();
    }

    async drawInspectorInfo(): Promise<void> {
        const inspector = this.ourContentHolder.ecosystem.doc.getElementById("InspectorPanel") as HTMLElement;
        (inspector.querySelector("#ItemType") as HTMLElement).innerText = "Asset Bundle";
    }
    performPrimaryMethod(): void {

    }
    cleanupItem(): void {

    }

}