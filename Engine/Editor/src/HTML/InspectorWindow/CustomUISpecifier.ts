import { savedProperty } from "@BabylonBurstCore/EntitySystem/TypeRegister";
import {
    GetEditorObjectWithValues,
    SetInputValueFromDatalist,
    SetupContentInputWithDatalist,
} from "../../Utils/ContentTypeTrackers";
import { ContentItem, ContentItemType } from "../ContentBrowser/ContentItem";
import { UISpecifier } from "@BabylonBurstClient/GUI/UISpecifier";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { Observable } from "@babylonjs/core";
import { ProcessGenericSpecifierComp } from "@BabylonBurstEditor/HTML/InspectorWindow/CustomSpecifierGeneric";

export function ProcessUISpecifierComp(
    container: HTMLElement,
    propType: savedProperty,
    parentData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
): boolean {
    return ProcessGenericSpecifierComp(
        container,
        propType,
        parentData,
        changeCallback,
        ecosystem,
        requireRefresh,
        UISpecifier,
        ContentItemType.UI
    )
}
