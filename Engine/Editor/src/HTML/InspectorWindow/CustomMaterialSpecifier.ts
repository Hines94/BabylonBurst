import { savedProperty } from "@BabylonBurstCore/EntitySystem/TypeRegister";
import { ContentItemType } from "../ContentBrowser/ContentItem";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { Observable } from "@babylonjs/core";
import { MaterialSpecifier } from "@BabylonBurstCore/Rendering/MaterialSpecifier";
import { ProcessGenericSpecifierComp } from "@BabylonBurstEditor/HTML/InspectorWindow/CustomSpecifierGeneric";

export function ProcessMaterialSpecifierComp(
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
        MaterialSpecifier,
        ContentItemType.Material,
    );
}
