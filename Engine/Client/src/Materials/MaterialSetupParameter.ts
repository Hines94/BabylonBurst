import { Color3, Material } from "@babylonjs/core";
import { AsyncImageDescription } from "@engine/AsyncAssets";

/** Generic parameter to set in our Material (eg image/float etc) */
export abstract class MaterialSetupParameter {
    /** Given a material instance try set our parameter */
    abstract SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void>;

    /** Setup into our Editor table so we can change the value (eg setup text input to find path etc). Use values[paramName] to store data */
    abstract SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void;

    /** Generic easy method for trying to set a parameter into a material instance */
    TrySetMatParameter(mat: any, paramName: string, param: any): boolean {
        if (param === undefined) {
            return true;
        }
        if (mat[paramName] !== undefined) {
            mat[paramName] = param;
            return true;
        }
        const block = mat.getBlockByName(paramName);
        if (block) {
            block.value = param;
            return true;
        }

        console.warn("Could not set param for mat: " + paramName);
        return false;
    }
}

//Unfortunate but better than making messy Editor/Client code in one hit. Use values[paramName] to store data for asyncTexture
var AsyncRowSetupEditorCallback: (
    tableCell: HTMLTableCellElement,
    values: any,
    paramName: string,
    param: MaterialSetupParameter,
) => void;
export function SetAsyncTextureSetupEditorCallback(
    callback: (tableCell: HTMLTableCellElement, values: any, paramName: string, param: MaterialSetupParameter) => void,
) {
    AsyncRowSetupEditorCallback = callback;
}

/** Async load in a texture and set it into material (e.g Diffuse) */
export class AsyncTextureSetupParameter extends MaterialSetupParameter {
    async SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void> {
        const textureData = loadedData[paramName];
        if (textureData === undefined || textureData.FilePath === undefined || textureData.FileName === undefined) {
            return;
        }
        //Try Get texture
        const texture = new AsyncImageDescription(textureData.FilePath, textureData.FileName);
        const loadedTexture = await texture.GetImageAsTexture(mat.getScene());
        if (!loadedTexture) {
            return;
        }
        if (textureData.uScale !== undefined) {
            loadedTexture.uScale = parseFloat(textureData.uScale);
        }
        if (textureData.vScale !== undefined) {
            loadedTexture.vScale = parseFloat(textureData.vScale);
        }
        this.TrySetMatParameter(mat, paramName, loadedTexture);
    }

    //TODO: This is within the client code but Editor specific?
    SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void {
        if (AsyncRowSetupEditorCallback) {
            AsyncRowSetupEditorCallback(tableCell, values, paramName, this);
        }
    }
}

export class BooleanSetupParameter extends MaterialSetupParameter {
    async SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void> {
        this.TrySetMatParameter(mat, paramName, loadedData[paramName]);
    }

    //TODO: This is within the client code but Editor specific?
    SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void {
        if (AsyncRowSetupEditorCallback) {
            AsyncRowSetupEditorCallback(tableCell, values, paramName, this);
        }
    }
}

export class ColorSetupParameter extends MaterialSetupParameter {
    async SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void> {
        var col = new Color3(0, 0, 0);
        if (loadedData[paramName] !== undefined) {
            col = Color3.FromHexString(loadedData[paramName]);
        }
        this.TrySetMatParameter(mat, paramName, col);
    }

    //TODO: This is within the client code but Editor specific?
    SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void {
        if (AsyncRowSetupEditorCallback) {
            AsyncRowSetupEditorCallback(tableCell, values, paramName, this);
        }
    }
}

export class ScalarSetupParameter extends MaterialSetupParameter {
    async SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void> {
        this.TrySetMatParameter(mat, paramName, loadedData[paramName]);
    }

    //TODO: This is within the client code but Editor specific?
    SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void {
        if (AsyncRowSetupEditorCallback) {
            AsyncRowSetupEditorCallback(tableCell, values, paramName, this);
        }
    }
}
