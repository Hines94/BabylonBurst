
import { LoadHTMLUITemplate } from "@BabylonBoostClient/HTML/TemplateLoader";
import { BaseTickableObject } from "@BabylonBoostClient/Utils/BaseTickableObject";
import { BabylonBoostEditor } from "../BabylonBoostEditor";
import { ContentItem, ContentItemType, GetFullNameOfObject, SaveContentItem } from "./ContentBrowser/ContentItem";
import { SetupCustomInspectorEditors } from "./InspectorWindow/CustomInspectorInputs";
import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";
import { SaveEntitiesToMsgpackIntArray } from "@BabylonBoostClient/EntitySystem/EntityMsgpackConverter";
import { v4 as uuidv4 } from "uuid";
import { encode } from "@msgpack/msgpack";
import { AsyncAWSBackend, AsyncAssetManager } from "@BabylonBoostClient/AsyncAssets/index";
import { ContentBrowserHTML, ContentStorageBackend, GetCurrentLevelItem } from "./ContentBrowser/ContentBrowserHTML";

export class CustomEditorHTML extends BaseTickableObject {
    EditorOwner: HTMLDivElement;
    contentBrowser: ContentBrowserHTML;
    editor: BabylonBoostEditor;
    editorStore: ContentStorageBackend;

    constructor(editor: BabylonBoostEditor) {
        super();
        this.editor = editor;
        SetupCustomInspectorEditors();
        this.setupHTML();
    }

    async setupHTML() {
        if (this.EditorOwner && this.EditorOwner.parentElement) {
            this.EditorOwner.parentElement.removeChild(this.EditorOwner);
        }
        this.EditorOwner = await LoadHTMLUITemplate("EditorTemplate", this.EditorOwner);

        this.contentBrowser = new ContentBrowserHTML(
            this.editor.canvas.ownerDocument.getElementById("ContentBrowser") as HTMLDivElement,
            this.editor
        );

        this.setupEditorContentBrowser();
    }

    setupEditorContentBrowser() {
        this.setupEditorItems();
    }

    async getS3ContentItems(): Promise<ContentItem> {
        const AWS = AsyncAssetManager.GetAssetManager().backendStorage as AsyncAWSBackend;
        const allObjects = await AWS.listObjects();

        const topLevelHigherarch: ContentItem = {
            nameExtension: "",
            readableName: "BASEASSETS",
            category: ContentItemType.BASEASSETSLAYER,
            containedItems: {},
            parent: undefined,
        };
        allObjects.forEach(item => {
            const folders = item.Key.split("/");
            const objectName = folders.pop().replace(".zip", "");
            var currentLevel = topLevelHigherarch;
            //Check folders exist
            folders.forEach(folder => {
                const existingFolder = currentLevel.containedItems[folder];
                if (existingFolder === undefined) {
                    currentLevel.containedItems[folder] = {
                        nameExtension: "/",
                        readableName: folder,
                        category: ContentItemType.Folder,
                        parent: currentLevel,
                        containedItems: {},
                    };
                }
                currentLevel = currentLevel.containedItems[folder];
            });
            //Create object
            if (objectName !== "") {
                const parts = objectName.split("~");
                var objectType = ContentItemType.Unknown;
                var nameExtension = ".zip";
                var objectCleanName = objectName;
                //Has known type?
                if (parts.length > 1) {
                    nameExtension = "~" + parts[1] + "~.zip";
                    objectCleanName = parts[0];
                    objectType = parseInt(parts[1], 10);
                }
                currentLevel.containedItems[objectName] = {
                    nameExtension: nameExtension,
                    readableName: objectCleanName,
                    category: objectType,
                    parent: currentLevel,
                    lastModified: item.LastModified,
                    size: item.Size,
                };
            }
        });
        return topLevelHigherarch;
    }

    async setupEditorItems() {
        const topLevelHigherarch = await this.getS3ContentItems();
        //Setup content browser
        this.editorStore = {
            allStoredItems: topLevelHigherarch,
            currentFolderLevel: [],
            getNewContentOptions: () => {
                const currentLevel = GetCurrentLevelItem(this.editorStore);
                return [
                    {
                        nameExtension: "~" + ContentItemType.Prefab + "~.zip",
                        readableName: "New Prefab",
                        category: ContentItemType.Prefab,
                        parent: currentLevel,
                        lastModified: new Date(),
                        data: [
                            encode({
                                prefabID: uuidv4(),
                                prefabData: SaveEntitiesToMsgpackIntArray({}),
                            }),
                        ],
                    },
                    {
                        nameExtension: "/",
                        readableName: "New Folder",
                        category: ContentItemType.Folder,
                        parent: currentLevel,
                        containedItems: {},
                    },
                ];
            },
            onContentChange: () => {
                return;
            },
            requestRefresh: () => {
                this.hardReloadContentBrowser();
            },
            requestDelete: (object: ContentItem) => {
                const path = GetFullNameOfObject(object);
                const AWS = AsyncAssetManager.GetAssetManager().backendStorage as AsyncAWSBackend;
                return AWS.deleteObject(path);
            },
            saveItem: (item: ContentItem) => {
                AsyncAssetManager.GetAssetManager().ResetAnyCaching(GetFullNameOfObject(item), 0);
                return SaveContentItem(AsyncAssetManager.GetAssetManager().backendStorage, item);
            },
        };
        this.contentBrowser.setupStorage(this.editorStore);
    }

    async hardReloadContentBrowser() {
        const topLevelHigherarch = await this.getS3ContentItems();
        this.editorStore.allStoredItems = topLevelHigherarch;
        //Preserve folder level
        const newFolderLevel: ContentItem[] = [];
        var currentLevel: ContentItem = topLevelHigherarch;
        for (var i = 0; i < this.editorStore.currentFolderLevel.length; i++) {
            const oldItem = this.editorStore.currentFolderLevel[i];
            if (currentLevel.containedItems[oldItem.readableName] !== undefined) {
                currentLevel = currentLevel.containedItems[oldItem.readableName];
                newFolderLevel.push(currentLevel);
            } else {
                break;
            }
        }
        this.editorStore.currentFolderLevel = newFolderLevel;
        this.contentBrowser.rebuildStoredItems();
    }

    performTick(ecosystem: GameEcosystem): void {}
}
