
import { LoadHTMLUITemplate } from "@BabylonBurstClient/HTML/TemplateLoader";
import { BaseTickableObject } from "@BabylonBurstClient/Utils/BaseTickableObject";
import { BabylonBurstEditor } from "../BabylonBurstEditor";
import { ContentItem, ContentItemType } from "./ContentBrowser/ContentItem";
import { ContentBrowserHTML, ContentStorageBackend } from "./ContentBrowser/ContentBrowserHTML";
import { SetupForModelTrackingRefresh } from "../Utils/EditorModelSpecifier";
import { AssetFolder } from "./ContentBrowser/AssetFolder";
import { AssetBundle } from "./ContentBrowser/AssetBundle";
import { Scene } from "@babylonjs/core";
import { encode } from "@msgpack/msgpack";
import { v4 as uuidv4 } from "uuid";
import { RefreshObjectTypeTracking } from "../Utils/ContentTypeTrackers";
import { AsyncAWSBackend, AsyncAssetManager } from "@engine/AsyncAssets";
import { GameEcosystem } from "@engine/GameEcosystem";
import { SetupAllTopBarOptions } from "./HTMLUtils/TopBarSetup";

//This assumes only one editor per time - pretty reasonable
export var topLevelEditorFolder:AssetFolder;
export var mainEditorScene:Scene;

export class CustomEditorHTML extends BaseTickableObject {
    EditorOwner: HTMLDivElement;
    contentBrowser: ContentBrowserHTML;
    editor: BabylonBurstEditor;
    editorStore: ContentStorageBackend;

    constructor(editor: BabylonBurstEditor) {
        super();
        this.editor = editor;
        mainEditorScene = editor.scene;
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

        SetupAllTopBarOptions(this.editor,{},{},{bHigherarchyOption:false})
    }

    setupEditorContentBrowser() {
        this.setupEditorItems();
    }

    async getS3ContentItems(): Promise<AssetFolder> {
        const AWS = AsyncAssetManager.GetAssetManager().backendStorage as AsyncAWSBackend;
        const allObjects = await AWS.listObjects();

        const topLevelHigherarch = new AssetFolder(undefined,AWS);
        topLevelHigherarch.name = "ASSETS_ROOT";

        if(!allObjects){
            return topLevelHigherarch;
        }

        for(var i = 0; i < allObjects.length;i++) {
            const item = allObjects[i];
            const folders = item.Key.split("/");
            const fullName = folders.pop();
            const objectName = fullName.replace(".zip", "").replace("~p~","");
            var currentLevel = topLevelHigherarch;
            //Check folders exist
            folders.forEach(folder => {
                const existingFolder = currentLevel.containedFolders.filter(f=>{return f.name === folder});
                if (existingFolder.length === 0) {
                    const newFolder = new AssetFolder(folder,AWS);
                    newFolder.parent = currentLevel;
                    currentLevel.containedFolders.push(newFolder);
                }
                currentLevel = currentLevel.containedFolders.filter(f=>{return f.name === folder})[0];
            });
            //Create Asset Stores
            if (objectName !== "") {
                const store = new AssetBundle({
                    lastModified: item.LastModified,
                    name:objectName,
                    size: item.Size,
                    parent:currentLevel,
                    storedBackend:AWS,
                    bSavedAsPredownload:fullName.includes("~p~")
                });
                currentLevel.containedItems.push(store);
            }
        }
        return topLevelHigherarch;
    }

    async setupEditorItems() {
        SetupForModelTrackingRefresh();
        topLevelEditorFolder = await this.getS3ContentItems();
        //Setup content browser
        this.editorStore = {
            allStoredItems: topLevelEditorFolder,
            currentFolderLevel: [],
            getNewContentOptions: () => {
                const newPrefab = new ContentItem(undefined,undefined);
                newPrefab.name = "New Prefab";
                newPrefab.category = ContentItemType.Prefab;
                newPrefab.data = encode({
                    prefabID: uuidv4(),
                    prefabData: encode({}),
                });

                const newMaterial = new ContentItem(undefined,undefined);
                newMaterial.name = "New Material";
                newMaterial.category = ContentItemType.Material;
                newMaterial.data = encode({
                    MaterialShaderType: "PBRMaterialShader",
                });

                const newUI = new ContentItem(undefined,undefined);
                newUI.name = "New UI";
                newUI.category = ContentItemType.UI;
                newUI.data = encode(            
                `<div> 
                    <h1>Hello World</h1> 
                </div>`);

                return [
                    newPrefab,
                    newMaterial,
                    newUI
                ];
            },
            onContentChange: () => {
                RefreshObjectTypeTracking();
            },
            requestRefresh: () => {
                this.hardReloadContentBrowser();
            }
        };
        this.contentBrowser.setupStorage(this.editorStore);
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
