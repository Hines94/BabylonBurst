import { Material } from "@babylonjs/core";

/** Generic parameter to set in our Material (eg image/float etc) */
export abstract class MaterialSetupParameter {
    /** Given a material instance try set our parameter */
    abstract SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void>;

    /** Setup into our Editor table so we can change the value (eg setup text input to find path etc). Use values[paramName] to store data */
    abstract SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void;

    /** Generic easy method for trying to set a parameter into a material instance */
    TrySetMatParameter(mat: any, paramName: string, param: any): boolean {
        if (mat[paramName]) {
            mat[paramName] = param;
            return true;
        }
        //TODO: If node material??
    }
}

//Unfortunate but better than making messy Editor/Client code in one hit. Use values[paramName] to store data for asyncTexture
var AsyncTextureSetupEditorCallback: (
    tableCell: HTMLTableCellElement,
    values: any,
    paramName: string,
    param: AsyncTextureSetupParameter
) => void;
export function SetAsyncTextureSetupEditorCallback(
    callback: (
        tableCell: HTMLTableCellElement,
        values: any,
        paramName: string,
        param: AsyncTextureSetupParameter
    ) => void
) {
    AsyncTextureSetupEditorCallback = callback;
}

/** Async load in a texture and set it into material (e.g Diffuse) */
export class AsyncTextureSetupParameter extends MaterialSetupParameter {
    async SetParameterIntoMaterial(mat: Material, paramName: string, loadedData: any): Promise<void> {
        console.log("Set param called for Texture");
        //TODO: Try Get texture
        //this.TrySetMatParameter(mat,paramName,)
    }

    //TODO: This is within the client code but Editor specific?
    SetupEditorInputValue(tableCell: HTMLTableCellElement, values: any, paramName: string): void {
        if (AsyncTextureSetupEditorCallback) {
            AsyncTextureSetupEditorCallback(tableCell, values, paramName, this);
        }
    }
}
