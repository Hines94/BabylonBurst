import { savedProperty } from "@BabylonBurstCore/EntitySystem/TypeRegister";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { ContentItem, ContentItemType } from "@BabylonBurstEditor/HTML/ContentBrowser/ContentItem";
import { GetEditorObjectWithValues, SetInputValueFromDatalist, SetupContentInputWithDatalist } from "@BabylonBurstEditor/Utils/ContentTypeTrackers";
import { Observable } from "@babylonjs/core"

export function ProcessGenericSpecifierComp(
    container: HTMLElement,
    propType: savedProperty,
    parentData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
    classType:any,
    contentType:ContentItemType
): boolean {
    if (propType.type !== classType) {
        return false;
    }

    const input = container.ownerDocument.createElement("input");
    input.classList.add("form-control");
    input.style.marginBottom = "5px";
    SetupContentInputWithDatalist(contentType, input, (val: ContentItem) => {
        const newMat = new classType();
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
        if(!existingData || !existingData.FilePath || !existingData.fileName) return;
        
        var existingItem = GetEditorObjectWithValues(
            contentType,
            existingData.FilePath,
            existingData.FileName,
        );
        SetInputValueFromDatalist(input, existingItem);
        
    }
}
