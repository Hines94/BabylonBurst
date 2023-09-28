
import { LoadHTMLUITemplate } from "@BabylonBurstClient/HTML/TemplateLoader";
import { BaseTickableObject } from "@BabylonBurstClient/Utils/BaseTickableObject";
import { BabylonBurstEditor } from "../BabylonBurstEditor";
import { ContentItem, ContentItemType } from "./ContentBrowser/ContentItem";
import { SetupCustomInspectorEditors } from "./InspectorWindow/CustomInspectorInputs";
import { GameEcosystem } from "@BabylonBurstClient/GameEcosystem";
import { SaveEntitiesToMsgpackIntArray } from "@BabylonBurstClient/EntitySystem/EntityMsgpackConverter";
import { v4 as uuidv4 } from "uuid";
import { encode } from "@msgpack/msgpack";
import { AsyncAWSBackend, AsyncAssetManager } from "@BabylonBurstClient/AsyncAssets/index";
import { ContentBrowserHTML, ContentStorageBackend, GetCurrentLevelItem } from "./ContentBrowser/ContentBrowserHTML";
import { RefreshAllModelPaths } from "../Utils/EditorModelSpecifier";
import { TrackAllObjectTypes } from "../Utils/ContentTypeTrackers";
import { AssetFolder } from "./ContentBrowser/AssetFolder";
import { AssetBundle } from "./ContentBrowser/AssetBundle";

export class CustomEditorHTML extends BaseTickableObject {
    EditorOwner: HTMLDivElement;
    contentBrowser: ContentBrowserHTML;
    editor: BabylonBurstEditor;
    editorStore: ContentStorageBackend;

    constructor(editor: BabylonBurstEditor) {
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

    async getS3ContentItems(): Promise<AssetFolder> {
        const AWS = AsyncAssetManager.GetAssetManager().backendStorage as AsyncAWSBackend;
        const allObjects = await AWS.listObjects();

        const topLevelHigherarch = new AssetFolder(undefined,AWS);

        allObjects.forEach(item => {
            const folders = item.Key.split("/");
            const objectName = folders.pop().replace(".zip", "");
            var currentLevel = topLevelHigherarch;
            //Check folders exist
            folders.forEach(folder => {
                const existingFolder = currentLevel.containedFolders[folder];
                if (existingFolder === undefined) {
                    currentLevel.containedFolders[folder] = new AssetFolder(folder,AWS);
                    currentLevel.containedFolders[folder].parent = currentLevel;
                }
                currentLevel = currentLevel.containedFolders[folder];
            });
            //Create Asset Stores
            if (objectName !== "") {
                const store = new AssetBundle({
                    lastModified: item.LastModified,
                    name:objectName,
                    size: item.Size,
                    parent:currentLevel,
                    storedBackend:AWS
                });
                currentLevel.containedItems.push(store);
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
                const newPrefab = new ContentItem(undefined,undefined);
                newPrefab.name = "New Prefab";
                newPrefab.category = ContentItemType.Prefab;

                const newMaterial = new ContentItem(undefined,undefined);
                newMaterial.name = "New Material";
                newMaterial.category = ContentItemType.Material;

                return [
                    newPrefab,
                    newMaterial
                ];
            },
            onContentChange: () => {
                return;
            },
            requestRefresh: () => {
                this.hardReloadContentBrowser();
            }
        };
        this.contentBrowser.setupStorage(this.editorStore);
        TrackAllObjectTypes(topLevelHigherarch);
        console.error("TODO: Fix model auto paths")
        //RefreshAllModelPaths(topLevelHigherarch,this.editor.scene);
    }

    async hardReloadContentBrowser() {
        const topLevelHigherarch = await this.getS3ContentItems();
        this.editorStore.allStoredItems = topLevelHigherarch;
        //Preserve folder level
        const newFolderLevel: AssetFolder[] = [];
        var currentLevel: AssetFolder = topLevelHigherarch;
        for (var i = 0; i < this.editorStore.currentFolderLevel.length; i++) {
            const oldItem = this.editorStore.currentFolderLevel[i];
            if (currentLevel.containedFolders[oldItem.name] !== undefined) {
                currentLevel = currentLevel.containedFolders[oldItem.name];
                newFolderLevel.push(currentLevel);
            } else {
                break;
            }
        }
        this.editorStore.currentFolderLevel = newFolderLevel;
        this.contentBrowser.rebuildStoredItems();
        console.error("TODO: Fix model auto paths")
        //RefreshAllModelPaths(topLevelHigherarch,this.editor.scene);
    }

    performTick(ecosystem: GameEcosystem): void {}
}
