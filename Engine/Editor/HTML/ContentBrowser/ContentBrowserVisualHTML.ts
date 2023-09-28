import { CloneTemplate, MakeDraggableElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentBrowserHTML } from "./ContentBrowserHTML";
import { VisualItem } from "./VisualItem";
import { SetInspectorOwner } from "../InspectorWindow/InspectorHTML";
import { ContextMenuItem, ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";

/** Anything that has a visual in the browser - asset/item/folder */
export abstract class ContentBrowserVisualHTML {
    ourContentHolder:ContentBrowserHTML;
    ourItem:VisualItem;
    /** Selectable div that we can color when inspecting this visual item */
    ourSelectable:HTMLElement;
    ourName:HTMLInputElement;

    constructor(ourContentHolder: ContentBrowserHTML, ourItem:VisualItem) {
        this.ourItem = ourItem;
        this.ourContentHolder = ourContentHolder;
        this.setupOurSelectable();
        this.ourSelectable.addEventListener("click", (ev:MouseEvent) => {
            if(ev.target !== this.ourSelectable) {
                return;
            }
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.performPrimaryMethod();
            } else {
                this.selectThisItem();
            }
        });
        if (this.ourContentHolder.autoselectItem === this.ourItem) {
            this.selectThisItem();
        }
        //Setup name
        this.ourName.addEventListener("change", this.itemNameChange.bind(this));
        this.ourName.value = this.ourItem.name;
        this.ourName.blur();
        //Setup context menu
        this.ourSelectable.addEventListener("contextmenu", event => {
            this.ourContentHolder.unclickAllItems();
            this.ourSelectable.classList.add("selectedContent");
            ShowContextMenu(event, this.getContextMenuItems().concat(this.getStandardContextMenuItems()), this.ourSelectable.ownerDocument);
        });
        //Keypress
        this.bindForKeypress();
    }

    private getStandardContextMenuItems(): ContextMenuItem[] {
        const item = this;
        return [
            {
                name:"Rename",callback:()=>{
                item.ourName.focus();
                }
            },
            {
                name:"Delete",callback:()=>{
                item.attemptDeletion();
                }
            },
        ]
    }

    /** Attempt to change the name of the item */
    abstract itemNameChange():void;
    /** Get context menu items specific for this item type */
    abstract getContextMenuItems():ContextMenuItem[];
    /** Requested delete for this item */
    abstract attemptDeletion():void;

    /** Select this item if we are clicked on */
    private selectThisItem() {
        this.ourContentHolder.unclickAllItems();
        this.ourSelectable.classList.add("selectedContent");
        this.DrawInspectorInfo();
    }

    private async DrawInspectorInfo(){
        if (this.ourSelectable.classList.contains("selectedContent") === false) {
            return;
        }
        const inspector = this.ourSelectable.ownerDocument.getElementById("InspectorPanel") as HTMLElement;
        inspector.classList.remove("hidden");
        inspector.innerHTML = "";
        const basicInfo = CloneTemplate("BasicItemInspectorInfo");
        inspector.appendChild(basicInfo);
        (basicInfo.querySelector("#ItemName") as HTMLElement).innerText = this.ourItem.name;
        //last modified
        const lastModified = inspector.querySelector("#LastModified") as HTMLElement;
        if (this.ourItem.lastModified) {
            lastModified.innerText = "Last Modified: " + formatDate(this.ourItem.lastModified);
        } else {
            lastModified.classList.add("hidden");
        }
        SetInspectorOwner(this);
        await this.drawInspectorInfo();
    }

    boundKeyFunc: any;
    private bindForKeypress() {
        this.boundKeyFunc = this.handleKeypress.bind(this);
        this.ourSelectable.ownerDocument.addEventListener("keydown", this.boundKeyFunc);
    }
    protected handleKeypress(event: any) {
        if (event.key === "F2") {
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.ourName.focus();
                event.preventDefault();
            }
        }
        if (event.key === "Delete") {
            if (this.ourSelectable.classList.contains("selectedContent")) {
                this.attemptDeletion();
                event.preventDefault();
            }
        }
    }

    abstract drawInspectorInfo():Promise<void>;
    abstract setupOurSelectable():void;
    abstract performPrimaryMethod():void;

    /** Cleanup this item after we no longer view it */
    CleanupItem() {
        if (this.boundKeyFunc) {
            this.ourSelectable.ownerDocument.removeEventListener("keydown", this.boundKeyFunc);
            this.boundKeyFunc = undefined;
        }
        this.cleanupItem();
    }
    protected abstract cleanupItem():void;

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