import {AsyncTextureSetupParameter,MaterialSetupParameter,ScalarSetupParameter,SetAsyncTextureSetupEditorCallback} from "@BabylonBurstClient/Materials/MaterialSetupParameter"
import { ContentItem, ContentItemType, GetFullNameOfObject } from "../ContentBrowser/ContentItem";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupInputWithDatalist } from "../../Utils/ContentTypeTrackers";
export function bindEditorMaterialParamSetupCallbacks() {
    SetAsyncTextureSetupEditorCallback(setupMaterialParameterType);
}

function setupMaterialParameterType(tableCell:HTMLTableCellElement, values: any, paramName: string,param:MaterialSetupParameter) {
    if(param instanceof AsyncTextureSetupParameter) {
        setupAsyncTexture(tableCell, values, paramName,param);
    } else if (param instanceof ScalarSetupParameter) {
        setupScalar(tableCell, values, paramName,param);
    }
}

function setupAsyncTexture(tableCell:HTMLTableCellElement, values: any, paramName: string,param:AsyncTextureSetupParameter) {
    var existingItem:ContentItem = undefined;
    if(values[paramName]) {
        existingItem = GetEditorObjectWithValues(ContentItemType.Image,values[paramName]["Path"],values[paramName]["Index"]);
    } else {
        values[paramName] = {};
    }

    //Create datalist with all possible image paths
    const datalistInput = tableCell.ownerDocument.createElement("input");
    tableCell.appendChild(datalistInput);
    SetupInputWithDatalist(ContentItemType.Image,datalistInput,(val:ContentItem) => {
        if(!val) {
            values[paramName]["Path"] = "";
            values[paramName]["Index"] = 0;
        } else {
            values[paramName]["Path"] = GetFullNameOfObject(val);
            values[paramName]["Index"] = val.fileIndex;
        }
    });
    SetInputValueFromDatalist(datalistInput,existingItem);
}

function setupScalar(tableCell:HTMLTableCellElement, values: any, paramName: string,param:ScalarSetupParameter) {
    const scalarInput = tableCell.ownerDocument.createElement("input");
    scalarInput.type = "number";
    if(values[paramName]) {
        scalarInput.value = values[paramName];
    } else {
        scalarInput.value = "0";
    }
    tableCell.appendChild(scalarInput);
    scalarInput.addEventListener("change" ,()=>{
        values[paramName] = scalarInput.value;
    })
    values[paramName] = scalarInput.value;
}