import { AxisInput } from "@BabylonBurstClient/Inputs/AxisInput";
import { ButtonInput } from "@BabylonBurstClient/Inputs/ButtonInput";
import { BrowserKeyNameValues } from "@BabylonBurstClient/Inputs/InputKeyNameValues";

/** contains some basic key values. Can be extended with custom values and swapped out in the ecosystem.Inputs */
export class WindowInputValues {
    mouseOverCanvas = false;

    mouseWheel = 0;
    mouseXDelta = 0;
    mouseYDelta = 0;
    /** Note: This has some slight input lag! */
    mouseScaledXPosition = 0;
    /** Note: This has some slight input lag! */
    mouseScaledYPosition = 0;
    /** Note: This has some slight input lag! */
    mouseUnscaledXPosition = 0;
    /** Note: This has some slight input lag! */
    mouseUnscaledYPosition = 0;

    /** Given a string input (Eg F) try to get the correct key */
    GetKey(stringKey: string): ButtonInput {
        var input = this.checkKeyExists(stringKey);
        if (input) {
            return input;
        }
        input = this.checkKeyExists(stringKey + "Key");
        if (input) {
            return input;
        }

        const upperKey = stringKey.toUpperCase();
        var input = this.checkKeyExists(upperKey);
        if (input) {
            return input;
        }
        input = this.checkKeyExists(upperKey + "Key");
        if (input) {
            return input;
        }

        return undefined;
    }

    private checkKeyExists(checkKey: string) {
        //@ts-ignore
        if (this[checkKey] !== undefined) {
            //@ts-ignore
            return this[checkKey] as ButtonInput;
        }
        return undefined;
    }
}

export class EditorKeybinds extends WindowInputValues {
    EDITORFORWARDAXIS = new AxisInput([BrowserKeyNameValues.WKEY], [BrowserKeyNameValues.SKEY]);
    EDITORSIDEAXIS = new AxisInput([BrowserKeyNameValues.DKEY], [BrowserKeyNameValues.AKEY]);
    EDITORUPAXIS = new AxisInput([BrowserKeyNameValues.SPACE], [BrowserKeyNameValues.CKEY]);
    EDITORCHANGEPERSPECTIVE = new ButtonInput([BrowserKeyNameValues.VKEY]);
    EDITORZOOMCAMERA = new ButtonInput([BrowserKeyNameValues.LEFTSHIFT]);
    EDITORPOSITIONGIZMO = new ButtonInput([BrowserKeyNameValues.EKEY]);
    EDITORROTATIONGIZMO = new ButtonInput([BrowserKeyNameValues.RKEY]);
    EDITORSCALEGIZMO = new ButtonInput([BrowserKeyNameValues.GKEY]);
}

/** Contains a set of basic keybinds to get a project moving */
export class BasicKeybinds extends WindowInputValues {
    //CAREFUL: Holding this whilst clicking etc can lead to big problems with browser keys
    LEFTCONTROLKey = new ButtonInput([BrowserKeyNameValues.LEFTCONTROL]);
    LEFTSHIFTKey = new ButtonInput([BrowserKeyNameValues.LEFTSHIFT]);
    LEFTALTKey = new ButtonInput([BrowserKeyNameValues.ALTKEY]);
    CAPSKey = new ButtonInput([BrowserKeyNameValues.CAPSKEY]);
    //Arrows
    ARROWUPKey = new ButtonInput([BrowserKeyNameValues.ARRUPKEY]);
    ARROWDOWNKey = new ButtonInput([BrowserKeyNameValues.ARRDOWNKEY]);
    ARROWLEFTKey = new ButtonInput([BrowserKeyNameValues.ARRLEFTKEY]);
    ARROWRIGHTKey = new ButtonInput([BrowserKeyNameValues.ARRRIGHTKEY]);
    //Numbers
    ZEROKey = new ButtonInput([BrowserKeyNameValues.ZEROKEY]);
    ONEKey = new ButtonInput([BrowserKeyNameValues.ONEKEY]);
    TWOKey = new ButtonInput([BrowserKeyNameValues.TWOKEY]);
    THREEKey = new ButtonInput([BrowserKeyNameValues.THREEKEY]);
    FOURKey = new ButtonInput([BrowserKeyNameValues.FOURKEY]);
    FIVEKey = new ButtonInput([BrowserKeyNameValues.FIVEKEY]);
    SIXKey = new ButtonInput([BrowserKeyNameValues.SIXKEY]);
    SEVENKey = new ButtonInput([BrowserKeyNameValues.SEVENKEY]);
    EIGHTKey = new ButtonInput([BrowserKeyNameValues.EIGHTKEY]);
    NINEKey = new ButtonInput([BrowserKeyNameValues.NINEKEY]);
    TILDEKey = new ButtonInput([BrowserKeyNameValues.TILDEKEY, BrowserKeyNameValues.TILDEKEYALT]);

    //General Keys
    XKey = new ButtonInput([BrowserKeyNameValues.XKEY]);
    YKey = new ButtonInput([BrowserKeyNameValues.YKEY]);
    ZKey = new ButtonInput([BrowserKeyNameValues.ZKEY]);
    PKey = new ButtonInput([BrowserKeyNameValues.PKEY]);
    FKey = new ButtonInput([BrowserKeyNameValues.FKEY]);
    IKey = new ButtonInput([BrowserKeyNameValues.IKEY]);
    TKey = new ButtonInput([BrowserKeyNameValues.TKEY]);
    GKey = new ButtonInput([BrowserKeyNameValues.GKEY]);
    HKey = new ButtonInput([BrowserKeyNameValues.HKEY]);
    BKey = new ButtonInput([BrowserKeyNameValues.BKEY]);
    EKey = new ButtonInput([BrowserKeyNameValues.EKEY]);
    RKey = new ButtonInput([BrowserKeyNameValues.RKEY]);

    /** Given a number ty to get the correct Key */
    GetNumberKey(index: Number): ButtonInput {
        if (index === 0) {
            return this.ZEROKey;
        } else if (index === 1) {
            return this.ONEKey;
        } else if (index === 2) {
            return this.TWOKey;
        } else if (index === 3) {
            return this.THREEKey;
        } else if (index === 4) {
            return this.FOURKey;
        } else if (index === 5) {
            return this.FIVEKey;
        } else if (index === 6) {
            return this.SIXKey;
        } else if (index === 7) {
            return this.SEVENKey;
        } else if (index === 8) {
            return this.EIGHTKey;
        } else if (index === 9) {
            return this.NINEKey;
        }
        return undefined;
    }
}
