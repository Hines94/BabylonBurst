import { ContentItem, ContentItemType } from "../HTML/ContentBrowser/ContentItem";
import { Observable, Scene } from "@babylonjs/core";
import { GetAllEditorObjectsOfType, editorObjectCategoriesChange } from "./ContentTypeTrackers";
import { mainEditorScene } from "../HTML/CustomEditorHTML";
import { SceneAsyncLoader } from "@BabylonBurstCore/AsyncAssets";
import { ModelSpecifier } from "@BabylonBurstCore/Rendering/InstancedRender";

export type ModelInformation = {
    specifier: ModelSpecifier;
    materialsNum: number;
};

var bound = false;

export function SetupForModelTrackingRefresh() {
    if (bound) {
        return;
    }
    editorObjectCategoriesChange.add(RefreshAllModelPaths);
    bound = true;
}

/** Paths and material number for all models */
export var ModelPaths: ModelInformation[] = [];
export const onModelPathsChangeObserver = new Observable<ModelInformation[]>();

export function IsValidModelSpecifier(model: ModelSpecifier) {
    if (model.FileName === undefined || model.FileName === "") {
        return false;
    }
    if (model.FilePath === undefined || model.FilePath === "") {
        return false;
    }
    if (model.MeshName === undefined || model.MeshName === "") {
        return false;
    }
    return (
        ModelPaths.find(m => {
            if (m.specifier.FileName !== model.FileName) {
                return false;
            }
            if (m.specifier.FilePath !== model.FilePath) {
                return false;
            }
            if (m.specifier.MeshName !== model.MeshName) {
                return false;
            }
            return true;
        }) !== undefined
    );
}

/** Given a way to get the model (file path etc) try to get information for it */
export function FindModelForParams(data: ModelSpecifier): ModelInformation {
    if (data === undefined || data === null) {
        return undefined;
    }
    for (var m = 0; m < ModelPaths.length; m++) {
        const model = ModelPaths[m];
        if (model.specifier.FileName !== data.FileName) {
            continue;
        }
        if (model.specifier.MeshName !== data.MeshName) {
            continue;
        }
        if (model.specifier.FilePath !== data.FilePath) {
            continue;
        }
        return model;
    }

    return undefined;
}

var builtModels: ContentItem[] = [];

export function RefreshAllModelPaths() {
    ModelPaths = [];
    const allModels = GetAllEditorObjectsOfType(ContentItemType.Model);
    if (allModels.every(item1 => builtModels.some(item2 => item2.name === item1.name))) {
        return;
    }
    builtModels = allModels;
    ModelPaths = [];
    allModels.forEach(item => GatherModelPaths(item, mainEditorScene, allModels));
}

async function GatherModelPaths(item: ContentItem, scene: Scene, allModels: ContentItem[]) {
    if (item.category !== ContentItemType.Model) {
        return;
    }
    const fullPath = item.parent.getItemLocation();
    var sceneLoader = SceneAsyncLoader.GetAsyncSceneLoader(scene, fullPath, item.GetSaveName());
    if (sceneLoader === undefined) {
        sceneLoader = new SceneAsyncLoader(fullPath, item.GetSaveName(), scene, "." + item.extension);
    }
    await sceneLoader.performAsyncLoad();
    if (allModels != builtModels) {
        return;
    }
    const uniques = sceneLoader.extractUniqueMeshes();
    const meshNames = Object.keys(uniques);
    for (var m = 0; m < meshNames.length; m++) {
        const meshName = meshNames[m];
        ModelPaths.push({
            materialsNum: uniques[meshName],
            specifier: { FilePath: fullPath, MeshName: meshName, FileName: item.GetSaveName() },
        });
    }
    onModelPathsChangeObserver.notifyObservers(ModelPaths);
}
