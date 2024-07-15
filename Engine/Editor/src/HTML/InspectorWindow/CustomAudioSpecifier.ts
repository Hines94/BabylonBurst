import { savedProperty } from "@BabylonBurstCore/EntitySystem/TypeRegister";
import { ContentItemType } from "../ContentBrowser/ContentItem";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { Observable } from "@babylonjs/core";
import { AudioSpecifier } from "@BabylonBurstCore/SFX/AudioSpecifier";
import { ProcessGenericSpecifierComp } from "@BabylonBurstEditor/HTML/InspectorWindow/CustomSpecifierGeneric";

export function ProcessAudioSpecifierComp(
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
        AudioSpecifier,
        ContentItemType.Audio,
    );
}
