import { CloneTemplate, MakeDraggableElement } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentBrowserHTML } from "../ContentBrowserHTML";
import { ContentBrowserVisualHTML } from "../ContentBrowserVisualHTML";
import { VisualItem } from "../VisualItem";
import { ContextMenuItem, ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { SetInspectorOwner } from "../../InspectorWindow/InspectorHTML";

const icons: { [type: number]: string } = {};
const iconPromises: { [type: number]: Promise<void> } = {};

/** Folder or item - something which is draggable and has an icon */
export abstract class ContentBrowserIconedItemHTML extends ContentBrowserVisualHTML {
    ourItemContainer:HTMLElement;
    iconImg: HTMLImageElement;

    constructor(ourContentHolder: ContentBrowserHTML, ourItem:VisualItem) {
        super(ourContentHolder,ourItem);
        MakeDraggableElement(this.ourSelectable, this.getDraggingText.bind(this));
        // this.bindForClassChanges();
    }

    setupOurSelectable(): void {
        this.ourItemContainer = CloneTemplate("ContentItem");
        this.ourSelectable = this.ourItemContainer.querySelector("#selectableContentItem");
        this.iconImg = this.ourItemContainer.querySelector("#ContentItemThumbnail");
        this.ourName = this.ourItemContainer.querySelector("#ContentItemName") as HTMLInputElement;
    }

    abstract getDraggingText():string;

    protected async SetIcon(iconCategory:string,iconImg:HTMLImageElement = this.iconImg) {
        if (icons[iconCategory] !== undefined) {
            iconImg.src = icons[iconCategory];
            return;
        }
        if (!iconPromises[iconCategory]) {
            iconPromises[iconCategory] = this.FetchIcon(iconCategory);
        }
        await iconPromises[iconCategory];
        iconImg.src = icons[iconCategory];
    }

    private async FetchIcon(iconCategory:string): Promise<void> {
        const response = await fetch("EditorIcons/" + iconCategory + "Icon.png");
        if (!response.ok) {
            return;
        }
        const blob = await response.blob();
        const imageURL = URL.createObjectURL(blob);
        icons[iconCategory] = imageURL;
        iconPromises[iconCategory] = undefined;
    }
}