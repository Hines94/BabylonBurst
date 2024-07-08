import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { DeviceSourceManager, DeviceType, DualShockInput, GenericPad, XboxInput } from "@babylonjs/core";

/** A handy list of inputs for all dualshock keys. NOTE: Values = value + 1000 (to differentiate in GetInputValue) */
export class BrowserDualshockKeyNameValues {
    static FACEBUTTONBOTTOM = 0 + 1100;
    static FACEBUTTONRIGHT = 1 + 1100;
    static FACEBUTTONLEFT = 2 + 1100;
    static FACEBUTTONTOP = 3 + 1100;

    static LEFTSHOULDER = 4 + 1100;
    static RIGHTSHOULDER = 5 + 1100;

    /** Note this is not working currently with dsm.getInput */
    static LEFTTRIGGER = 10 + 1100;
    /** Note this is not working currently with dsm.getInput */
    static RIGHTTRIGGER = 11 + 1100;

    static DPADDOWN = 13 + 1100;
    static DPADRIGHT = 15 + 1100;
    static DPADLEFT = 14 + 1100;
    static DPADUP = 12 + 1100;

    static ALTPAUSE = 16 + 1100;
}

/** A handy list of inputs for all xbox keys. NOTE: Values = value + 1000 (to differentiate in GetInputValue) */
export class BrowserXboxKeyNameValues {
    static FACEBUTTONBOTTOM = XboxInput.A + 1000;
    static FACEBUTTONRIGHT = XboxInput.B + 1000;
    static FACEBUTTONLEFT = XboxInput.X + 1000;
    static FACEBUTTONTOP = XboxInput.Y + 1000;

    static LEFTSHOULDER = XboxInput.LB + 1000;
    static RIGHTSHOULDER = XboxInput.RB + 1000;

    /** Note this is not working currently with dsm.getInput */
    static LEFTTRIGGER = XboxInput.LT + 1000;
    /** Note this is not working currently with dsm.getInput */
    static RIGHTTRIGGER = XboxInput.RT + 1000;

    static DPADDOWN = XboxInput.DPadDown + 1000;
    static DPADRIGHT = XboxInput.DPadRight + 1000;
    static DPADLEFT = XboxInput.DPadLeft + 1000;
    static DPADUP = XboxInput.DPadUp + 1000;

    static PAUSE = XboxInput.Start + 1000;
    static ALTPAUSE = XboxInput.Home + 1000;

    static LSTICKX = XboxInput.LStickXAxis + 1000;
    static LSTICKY = XboxInput.LStickYAxis + 1000;

    static RSTICKX = XboxInput.RStickXAxis + 1000;
    static RSTICKY = XboxInput.RStickYAxis + 1000;
}

/** A handy list of inputs for all keyboard and mouse keys */
export class BrowserKeyNameValues {
    //Mouse
    static LEFTMOUSE = 2;
    static RIGHTMOUSE = 4;
    static MIDDLEMOUSE = 3;

    //Keyboard
    static AKEY = 65;
    static WKEY = 87;
    static SKEY = 83;
    static DKEY = 68;
    static BKEY = 66;
    static XKEY = 88;
    static YKEY = 89;
    static ZKEY = 90;
    static PKEY = 80;
    static ALTKEY = 18;
    static INSERTKEY = 45;
    static ARRUPKEY = 38;
    static ARRDOWNKEY = 40;
    static ARRLEFTKEY = 37;
    static ARRRIGHTKEY = 39;
    /** CAREFUL WITH THIS - Shortcut for many Chrome functions like close window */
    static LEFTCONTROL = 17;
    static CAPSKEY = 20;
    static HOME = 36;
    static END = 35;
    static ENTER = 13;
    static DELETE = 46;
    static PGUP = 33;
    static PGDWN = 34;
    static LEFTSHIFT = 16;
    static SPACE = 32;
    static CKEY = 67;
    static QKEY = 81;
    static EKEY = 69;
    static NKEY = 78;
    static VKEY = 86;
    static TKEY = 84;
    static GKEY = 71;
    static RKEY = 82;
    static FKEY = 70;
    static LKEY = 76;
    static HKEY = 72;
    static ONEKEY = 49;
    static TWOKEY = 50;
    static THREEKEY = 51;
    static FOURKEY = 52;
    static FIVEKEY = 53;
    static SIXKEY = 54;
    static SEVENKEY = 55;
    static EIGHTKEY = 56;
    static NINEKEY = 57;
    static PERIODKEY = 110;
    static ZEROKEY = 48;
    static TILDEKEY = 192;
    static TILDEKEYALT = 223;
    static IKEY = 73;
    static ESCKEY = 27;
}

export const dynamicpropertyDSM = "___DYNAMICSOURCEMANAGER___";
export var ControlDeadzone = 0.05;

function getDeviceVal(dsm: DeviceSourceManager, type: DeviceType, input: number) {
    const device = dsm.getDeviceSource(type);
    if (!device) return 0;
    const val = device.getInput(input);
    if (val < ControlDeadzone && val > -ControlDeadzone) return 0;
    return val;
}

/** Handles any type of input required (keyboard, xbox etc) */
export function GetBoundInputValue(input: number, ecosystem: GameEcosystem) {
    const dsm = ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager;
    if (input < 5) {
        return getDeviceVal(dsm, DeviceType.Mouse, input);
    } else if (input < 1000) {
        return getDeviceVal(dsm, DeviceType.Keyboard, input);
    } else if (input < 1100) {
        return getDeviceVal(dsm, DeviceType.Xbox, input - 1000);
    } else if (input < 1200) {
        return getDeviceVal(dsm, DeviceType.DualShock, input - 1100);
    }
    return undefined;
}
