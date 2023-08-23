import { decode } from "@msgpack/msgpack";
import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";
import { ContextMenuItem, ShowContextMenu } from "@BabylonBoostClient/HTML/HTMLContextMenu";
import { ShowToastNotification } from "@BabylonBoostClient/HTML/HTMLToastItem";
import { CloneTemplate, GetNewNameItem, PreventDefaults, RemoveClassFromAllItems } from "@BabylonBoostClient/HTML/HTMLUtils";
import { ContentBrowserItemHTML } from "./ContentBrowserItemHTML";
import { ContentItem, ContentItemType, GetContentItemNameInclType } from "./ContentItem";
import { GetContentItemHTMLSpecific } from "./ContentItemTypes";

/** This connects our content browser to the storage mechanism. Eg player blueprints or Editor S3.  */
export interface ContentStorageBackend {
    /** All stored items from every level */
    allStoredItems: ContentItem;
    /** Way to drill down through selected folder levels */
    currentFolderLevel: ContentItem[];

    /** Get all new options we have available -eg prefab, data sheet etc */
    getNewContentOptions(): ContentItem[];

    /** Provided for easy callback when want to save out to base */
    onContentChange: () => void;

    requestRefresh: () => void;

    saveItem: (item: ContentItem) => Promise<boolean>;

    /** Request delete of an object */
    requestDelete: (object: ContentItem) => Promise<boolean>;
}

export function GetCurrentLevelItem(backend: ContentStorageBackend): ContentItem {
    if (backend.currentFolderLevel.length === 0) {
        return backend.allStoredItems;
    }
    return backend.currentFolderLevel[backend.currentFolderLevel.length - 1];
}

export class ContentBrowserHTML {
    browserBase: HTMLDivElement;
    contentGrid: HTMLDivElement;
    storageBackend: ContentStorageBackend;
    breadcrumbFolders: HTMLDivElement;
    ecosystem: GameEcosystem;

    constructor(browserBase: HTMLDivElement, owner: GameEcosystem) {
        this.ecosystem = owner;
        this.browserBase = browserBase;
        this.contentGrid = browserBase.querySelector("#ContBrowsItems");
        this.breadcrumbFolders = browserBase.querySelector("#FolderLinks");
        this.setupDragDrop();
    }

    setupStorage(store: ContentStorageBackend) {
        //TODO: Dismantle old items (callbacks etc?)
        const refreshButton = this.browserBase.querySelector("#RefreshContent");
        refreshButton.addEventListener("click", store.requestRefresh);
        this.storageBackend = store;

        this.bindUploadButton();

        //Setup existing items
        this.rebuildStoredItems();

        //Right click context menu
        this.browserBase.addEventListener("contextmenu", event => {
            if (
                event.target !== this.contentGrid &&
                event.target !== this.contentGrid.parentElement &&
                event.target !== this.browserBase
            ) {
                return;
            }
            const contextItems: ContextMenuItem[] = [];
            const newItems = store.getNewContentOptions();
            newItems.forEach(newItem => {
                contextItems.push({
                    name: "Create New " + ContentItemType[newItem.category],
                    callback: () => {
                        const currentLevelItems = GetCurrentLevelItem(this.storageBackend).containedItems;
                        newItem.readableName = GetNewNameItem(currentLevelItems, newItem.readableName);
                        this.addNewItem(newItem);
                    },
                });
            });
            this.unclickAllItems();
            ShowContextMenu(event, contextItems, this.ecosystem.doc);
        });

        //Regular click
        this.browserBase.addEventListener("click", event => {
            if (
                event.target !== this.contentGrid &&
                event.target !== this.contentGrid.parentElement &&
                event.target !== this.browserBase
            ) {
                return;
            }
            this.unclickAllItems();
        });
    }

    unclickAllItems() {
        RemoveClassFromAllItems("selectedContent", this.contentGrid);
    }

    buildItems: ContentBrowserItemHTML[];
    rebuildStoredItems() {
        //Unbind and close old items
        if (this.buildItems) {
            this.buildItems.forEach(item => {
                item.cleanupItem();
            });
        }

        this.buildItems = [];
        //Rebuild items
        this.contentGrid.innerHTML = "";
        const levelItems = GetCurrentLevelItem(this.storageBackend).containedItems;
        const keys = Object.keys(levelItems);
        keys.forEach(key => {
            const element = levelItems[key];
            const container = CloneTemplate("ContentItem");
            this.contentGrid.appendChild(container);
            this.buildItems.push(GetContentItemHTMLSpecific(element, container, this));
        });

        //Rebuild breadcrumbs
        this.breadcrumbFolders.innerHTML = "";
        //Breadcrumb base
        const AssetsOverall = this.ecosystem.doc.createElement("b");
        AssetsOverall.className = "folderLink";
        AssetsOverall.innerHTML = "Assets";
        AssetsOverall.onclick = () => {
            this.storageBackend.currentFolderLevel = [];
            this.rebuildStoredItems();
        };
        this.breadcrumbFolders.appendChild(AssetsOverall);
        //Breadcrumb children
        const currentLevel: ContentItem[] = [];
        this.storageBackend.currentFolderLevel.forEach(fold => {
            currentLevel.push(fold);
            const FolderLevel = this.ecosystem.doc.createElement("b");
            FolderLevel.className = "folderLink";
            const currentLevelCopy = [...currentLevel];
            FolderLevel.onclick = () => {
                this.storageBackend.currentFolderLevel = currentLevelCopy;
                this.rebuildStoredItems();
            };
            FolderLevel.innerHTML = "> " + fold.readableName;
            this.breadcrumbFolders.appendChild(FolderLevel);
        });
    }

    protected bindUploadButton() {
        const uploader = this.browserBase.querySelector("#ContentUploadUploader") as HTMLInputElement;
        this.browserBase.querySelector("#ContentUpload").addEventListener("click", () => {
            uploader.click();
        });
        const browser = this;
        uploader.addEventListener("change", event => {
            //@ts-ignore
            [...event.target.files].forEach(f => {
                browser.processDragDropFile(f);
            });
        });
    }

    protected setupDragDrop() {
        ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            this.browserBase.addEventListener(eventName, PreventDefaults, false);
        });

        ["dragenter", "dragover"].forEach(eventName => {
            //@ts-ignore
            this.browserBase.addEventListener(
                eventName,
                (event: DragEvent) => {
                    if (!event.dataTransfer.types.includes("text/plain")) {
                        this.browserBase.classList.add("dragover");
                    } else {
                        event.dataTransfer.dropEffect = "none";
                    }
                    event.preventDefault(); // Important to prevent the browser's default handling
                },
                false
            );
        });

        ["dragleave", "drop"].forEach(eventName => {
            this.browserBase.addEventListener(
                eventName,
                () => {
                    this.browserBase.classList.remove("dragover");
                },
                false
            );
        });

        this.browserBase.addEventListener("drop", this.handleFileDrop.bind(this), false);
    }

    /** For drag and drop file functionality */
    protected handleFileDrop(e: DragEvent) {
        let dt = e.dataTransfer;
        let files = dt.files;

        [...files].forEach(this.processDragDropFile.bind(this));
    }

    autoselectItem: ContentItem;
    addNewItem(item: ContentItem) {
        this.storageBackend.saveItem(item);
        item.data = undefined; //Reset data so load method inits correctly
        const currentLevel = GetCurrentLevelItem(this.storageBackend);
        currentLevel.containedItems[GetContentItemNameInclType(item)] = item;
        this.autoselectItem = item;
        this.rebuildStoredItems();
        this.autoselectItem = undefined;
        this.storageBackend.onContentChange();
    }

    /** For an individual drag and drop file, handle what we do with it */
    protected processDragDropFile(file: File) {
        processFileType(
            file,
            this,
            [
                { mimeType: "image/png", extension: ".png" },
                { mimeType: "image/jpeg", extension: ".jpg" },
            ],
            ContentItemType.Image
        );

        processFileType(file, this, [{ mimeType: "audio/wav", extension: ".wav" }], ContentItemType.Audio);
    }
}

/** Check if the file is of type and perform a new creation if so */
function processFileType(
    file: File,
    browser: ContentBrowserHTML,
    extensionTypes: { mimeType: string; extension: string }[],
    type: ContentItemType
) {
    const extensionMatch = extensionTypes.find(obj => obj.mimeType === file.type);
    if (!extensionMatch) {
        return;
    }

    if (!window.confirm(`Upload ${ContentItemType[type]} ${file.name}? (size ${file.size / 1000000} mb)`)) {
        return;
    }

    const currentLevel = GetCurrentLevelItem(browser.storageBackend);
    const readName = file.name.replace(extensionMatch.extension, "");
    var newItem: ContentItem = {
        nameExtension: "~" + type + "~.zip",
        readableName: readName,
        category: type,
        parent: currentLevel,
        lastModified: new Date(),
        data: [file],
        typeExtension: extensionMatch.extension,
    };
    browser.addNewItem(newItem);
    ShowToastNotification(`${ContentItemType[type]}: ${file.name} Uploaded Successfully!`);
}
