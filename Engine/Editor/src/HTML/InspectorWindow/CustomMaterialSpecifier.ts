import { savedProperty } from "@engine/EntitySystem/TypeRegister";
import {
    GetEditorObjectWithValues,
    SetInputValueFromDatalist,
    SetupContentInputWithDatalist,
} from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { Component } from "@engine/EntitySystem/Component";
import { GameEcosystem } from "@engine/GameEcosystem";
import { Observable } from "@babylonjs/core";
import { MaterialSpecifier } from "@engine/Rendering/MaterialSpecifier";

export function ProcessMaterialSpecifierComp(
    container: HTMLElement,
    propType: savedProperty,
    parentData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
): boolean {
    if (propType.type !== MaterialSpecifier) {
        return false;
    }

    const input = container.ownerDocument.createElement("input");
    input.classList.add("form-control");
    input.style.marginBottom = "5px";
    SetupContentInputWithDatalist(ContentItemType.Material, input, (val: ContentItem) => {
        const newMat = new MaterialSpecifier();
        if (val === undefined || val === null) {
            changeCallback(newMat);
        } else {
            newMat.FileName = val.GetSaveName();
            newMat.FilePath = val.parent.getItemLocation();
            changeCallback(newMat);
        }
    });
    container.appendChild(input);

    RefreshValueToComp();

    requireRefresh.add(RefreshValueToComp);

    return true;

    function RefreshValueToComp() {
        const existingData = parentData[propType.name];
        if (existingData.FilePath !== undefined && existingData.FileName !== undefined) {
            var existingItem = GetEditorObjectWithValues(
                ContentItemType.Material,
                existingData.FilePath,
                existingData.FileName,
            );
            SetInputValueFromDatalist(input, existingItem);
        }
    }
}
