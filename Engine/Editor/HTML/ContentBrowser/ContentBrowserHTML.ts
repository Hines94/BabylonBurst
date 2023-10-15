import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { ContextMenuItem, ShowContextMenu } from "@BabylonBurstClient/HTML/HTMLContextMenu";
import { ShowToastError, ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { DraggedElement, GetNewNameItem, MakeDroppableGenericElement, PreventDefaults, RemoveClassFromAllItems } from "@BabylonBurstClient/HTML/HTMLUtils";
import { ContentItem, ContentItemType, GetContentTypeFromFilename } from "./ContentItem";
import { ContentBrowserVisualHTML } from "./ContentBrowserVisualHTML";
import { ContentBrowserFolderHTML } from "./Specifics/ContentBrowserFolderHTML";
import { VisualItem } from "./VisualItem";
import { AssetFolder } from "./AssetFolder";
import { ContentBrowserAssetBundleHTML } from "./Specifics/ContentBrowserAssetBundleHTML";
import { GetFileExtension } from "@BabylonBurstClient/Utils/StringUtils";
import { RefreshFolderTracking } from "../../Utils/ContentTypeTrackers";

/** This connects our content browser to the storage mechanism. Eg player blueprints or Editor S3.  */
export interface ContentStorageBackend {
    /** All stored items from every level */
    allStoredItems: AssetFolder;
    /** Way to drill down through selected folder levels */
    currentFolderLevel: AssetFolder[];

    /** Get all new options we have available -eg prefab, data sheet etc */
    getNewContentOptions(): ContentItem[];

    /** Provided for easy callback when want to save out to base */
    onContentChange: () => void;

    /** Refresh currently loaded items */
    requestRefresh: () => void;
}

export function GetCurrentLevelItem(backend: ContentStorageBackend): AssetFolder {
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

        const browser = this;

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
            contextItems.push({name:"Create New Folder",callback:()=>{
                const currentLevel = GetCurrentLevelItem(store);
                const folder = currentLevel.GenerateNewFolder();
                this.autoselectItem = folder; 
                browser.rebuildStoredItems();
                RefreshFolderTracking();
            }})
            const newItems = store.getNewContentOptions();
            newItems.forEach(newItem => {
                contextItems.push({
                    name: "Create New " + ContentItemType[newItem.category],
                    callback: () => {
                        const currentLevelItems = GetCurrentLevelItem(store).containedItems;
                        newItem.name = GetNewNameItem(currentLevelItems, newItem.name);
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
            this.hideInspector();
        });
    }

    unclickAllItems() {
        RemoveClassFromAllItems("selectedContent", this.contentGrid);
    }

    hideInspector() {
        this.browserBase.ownerDocument.getElementById('InspectorPanel').classList.add('hidden');
    }

    buildItems: ContentBrowserVisualHTML[];
    rebuildStoredItems() {
        //Unbind and close old items
        if (this.buildItems) {
            this.buildItems.forEach(item => {
                item.CleanupItem();
            });
        }
        const browser = this;
        this.buildItems = [];
        this.contentGrid.innerHTML = "";

        //Draw folders
        rebuildFolders();
        rebuildAssetBundles();

        //Rebuild breadcrumbs
        rebuildBreadcrumbs();

        function rebuildFolders() {
            const levelItems = GetCurrentLevelItem(browser.storageBackend).containedFolders;
            const keys = Object.keys(levelItems);
            keys.forEach(key => {
                browser.buildItems.push(new ContentBrowserFolderHTML(browser, levelItems[key]));
            });
        }

        function rebuildAssetBundles() {
            const levelItems = GetCurrentLevelItem(browser.storageBackend).containedItems;
            const keys = Object.keys(levelItems);
            keys.forEach(key => {
                browser.buildItems.push(new ContentBrowserAssetBundleHTML(browser, levelItems[key]));
            });
        }

        function rebuildBreadcrumbs() {
            browser.breadcrumbFolders.innerHTML = "";
            //Breadcrumb base
            const AssetsOverall = browser.ecosystem.doc.createElement("b");
            AssetsOverall.className = "folderLink";
            AssetsOverall.innerHTML = "Assets";
            AssetsOverall.onclick = () => {
                browser.storageBackend.currentFolderLevel = [];
                browser.rebuildStoredItems();
            };
            browser.breadcrumbFolders.appendChild(AssetsOverall);
            setupBreadcumbElement(AssetsOverall,browser.storageBackend.allStoredItems,browser);
            //Breadcrumb children
            const currentLevel: AssetFolder[] = [];
            for(var i = 0; i < browser.storageBackend.currentFolderLevel.length;i++) {
                const fold = browser.storageBackend.currentFolderLevel[i];
                currentLevel.push(fold);
                const FolderLevel = browser.ecosystem.doc.createElement("b");
                FolderLevel.className = "folderLink";
                const currentLevelCopy = [...currentLevel];
                FolderLevel.onclick = () => {
                    browser.storageBackend.currentFolderLevel = currentLevelCopy;
                    browser.rebuildStoredItems();
                };
                FolderLevel.innerHTML = "> " + fold.name;
                browser.breadcrumbFolders.appendChild(FolderLevel);
                if(i !== browser.storageBackend.currentFolderLevel.length) {
                    setupBreadcumbElement(FolderLevel,fold,browser);
                }
            };
        }
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
                browser.processUploadFile(f);
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
                    if(DraggedElement !== undefined && (DraggedElement as any).AssetBundle !== undefined) {
                        return;
                    }
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
        if(DraggedElement !== undefined && (DraggedElement as any).AssetBundle !== undefined) {
            return;
        }
        let dt = e.dataTransfer;
        let files = dt.files;
        //@ts-ignore
        [...files].forEach(this.processUploadFile.bind(this));
    }

    autoselectItem: VisualItem;
    async addNewItem(item: ContentItem) {
        //First generate new asset store
        const folderLevel = GetCurrentLevelItem(this.storageBackend);
        const newAssetStore = folderLevel.GenerateNewAssetBundle();
        item.parent = newAssetStore;
        newAssetStore.storedItems.push(item);
        if(!await newAssetStore.SaveItemOut()){
            console.error("Error saving new item!");
            return;
        }
        await newAssetStore.refreshContainedItems();
        this.autoselectItem = item;
        this.rebuildStoredItems();
        this.autoselectItem = undefined;
        this.storageBackend.onContentChange();
    }

    /** For an individual drag and drop file, handle what we do with it */
    protected async processUploadFile(file: File) {
        const contentType = GetContentTypeFromFilename(file.name);
        if(contentType === undefined) { return; }
        const folderLevel = GetCurrentLevelItem(this.storageBackend);
        const newAssetStore = folderLevel.GenerateNewAssetBundle();
        const ext = GetFileExtension(file.name);
        const plainName = file.name.replace("."+ext,"");
        var newItem = new ContentItem(undefined,undefined);
        newItem.category = contentType;
        newItem.name = plainName;
        newItem.extension = ext;
        newItem.data = file;
        newItem.parent = newAssetStore;
        newAssetStore.storedItems.push(newItem);
        newItem.storedBackend = newAssetStore.storedBackend;

        if(!await newItem.SaveItemOut()) {
            ShowToastError(`${ContentItemType[contentType]}: ${file.name} Upload Failed!`);
        } else {
            ShowToastNotification(`${ContentItemType[contentType]}: ${file.name} Uploaded Successfully!`);
            this.rebuildStoredItems();
        }
    }
}

function setupBreadcumbElement(FolderLevel:HTMLElement, folder: AssetFolder, browser:ContentBrowserHTML) {
    MakeDroppableGenericElement(FolderLevel,
        (ele:any)=>{
            if(ele.AssetBundle !== undefined) {
                if(folder.GetBundleWithName(ele.AssetBundle.name)) {
                    alert("Bundle already in folder with this name: " + ele.AssetBundle.name);
                    return;
                }
                folder.MoveAssetBundle(ele.AssetBundle);
                browser.rebuildStoredItems();

            }
            if(ele.AssetFolder !== undefined) {
                if(folder.GetFolderWithName(ele.AssetFolder.name)) {
                    alert("Folder already in folder with this name: " + ele.AssetFolder.name);
                    return;
                }
                folder.MoveAssetFolder(ele.AssetFolder);
                browser.rebuildStoredItems();
            }
        },
        (ele:any)=>{
            if(ele.AssetBundle !== undefined) { 
                return true;
            }
            if(ele.AssetFolder !== undefined) { 
                return true;
            }
            return false;
        }
    )
}