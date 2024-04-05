import { Observable } from "@babylonjs/core/Misc/observable.js";
import { Clamp, SimpleWeightedAverageSmooth } from "../../Shared/src/Utils/MathUtils";
import { UpdateDynamicTextureChecks } from "./GUI/AdvancedDynamicTextureTracker";
import { DeviceSourceManager, DeviceType, PointerInput, Vector2 } from "@babylonjs/core";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";

const dynamicpropertyDSM = "___DYNAMICSOURCEMANAGER___";

/**
 * An input for a specific keybind. Contains useful methods for checking if we have used or not.
 * */
export class ButtonInput {
    wasActive = false;
    isActive = false;

    //TODO: Incorporate mouse binds?
    currentKeybinds: number[];

    constructor(defaultKeybinds: number[]) {
        this.currentKeybinds = defaultKeybinds;
    }

    UpdateValue(ecosystem: GameEcosystem) {
        const vals: number[] = [];
        //If we are typing then don't activate!
        if (ecosystem.controlHasFocus) {
            this.setNewActivity([0]);
        } else {
            for (var i = 0; i < this.currentKeybinds.length; i++) {
                vals.push(GetKeyboardValue(this.currentKeybinds[i], ecosystem));
            }
            this.setNewActivity(vals);
        }
    }

    /** ONLY Set in input module! */
    setNewActivity(values: number[]) {
        if (values.length === 0) {
            return;
        }
        //If we have an alternative key?
        var newval = values[0];
        for (var i = 0; i < values.length; i++) {
            if (values[i] === 1) {
                newval = 1;
                break;
            }
        }
        this.wasActive = this.isActive;
        this.isActive = newval === 1 ? true : false;
        if (this.wasJustActivated()) {
            this.onActivateKey.notifyObservers(this);
        } else if (this.wasJustDeactivated()) {
            this.onDeactivateKey.notifyObservers(this);
        }
    }

    /** Check if we have just pressed this button or not */
    wasJustActivated() {
        return this.wasActive === false && this.isActive === true;
    }

    /**Check if we have just released the key for this button */
    wasJustDeactivated() {
        return this.wasActive === true && this.isActive === false;
    }

    /** Will be called when we first press this key down */
    onActivateKey = new Observable<ButtonInput>();
    /** Will be called when we first release this key */
    onDeactivateKey = new Observable<ButtonInput>();
}

export class AxisInput {
    positiveKeybinds: number[] = [];
    negativeKeybinds: number[] = [];

    axisValue = 0;
    priorAxisValue = 0;

    constructor(positiveKeybinds: number[], negativeKeybinds: number[]) {
        this.positiveKeybinds = positiveKeybinds;
        this.negativeKeybinds = negativeKeybinds;
    }

    UpdateValue(ecosystem: GameEcosystem) {
        const vals: number[] = [];
        var newValue = 0;
        //If we are typing then don't activate!
        if (!ecosystem.controlHasFocus) {
            for (var i = 0; i < this.positiveKeybinds.length; i++) {
                if (GetKeyboardValue(this.positiveKeybinds[i], ecosystem)) {
                    newValue += 1;
                }
            }
            for (var i = 0; i < this.negativeKeybinds.length; i++) {
                if (GetKeyboardValue(this.negativeKeybinds[i], ecosystem)) {
                    newValue -= 1;
                }
            }
        }

        this.setNewActivity(newValue);
    }

    setNewActivity(val: number) {
        this.priorAxisValue = this.axisValue;
        this.axisValue = Clamp(val, -1, 1);
    }
}

export class BrowserKeyNameValues {
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
    static LEFTMOUSE = 2;
    static RIGHTMOUSE = 4;
    static MIDDLEMOUSE = 3;
    static LEFTCONTROL = 17; //CAREFUL WITH THIS - Shortcut for many Chrome functions like close window
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

    primaryClick = new ButtonInput([]);
    secondaryClick = new ButtonInput([]);
    middleClick = new ButtonInput([]);

    OPENEDITORINSPECTOR = new ButtonInput([BrowserKeyNameValues.TILDEKEY]);

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

export function SetupInputsModule(ecosystem: GameEcosystem) {
    ecosystem.dynamicProperties[dynamicpropertyDSM] = new DeviceSourceManager(ecosystem.scene.getEngine());
    (ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager).onDeviceConnectedObservable.add(
        deviceSource => {
            // If Mouse/Touch, add an Observer to capture scroll wheel
            if (deviceSource.deviceType === DeviceType.Mouse || deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.add(eventData => {
                    if (eventData.inputIndex === PointerInput.MouseWheelY) {
                        if (eventData.deltaY > 0) {
                            ecosystem.InputValues.mouseWheel = 1;
                        } else {
                            ecosystem.InputValues.mouseWheel = -1;
                        }
                    }
                    if (eventData.inputIndex === PointerInput.Move) {
                        ecosystem.InputValues.mouseOverCanvas = true;
                        RecordMouseChanges(eventData.movementX, eventData.movementY);
                    }
                });
            }
        },
    );
    ecosystem.InputValues.mouseOverCanvas = ecosystem.scene.pointerX !== 0 && ecosystem.scene.pointerY !== 0;
    ecosystem.canvas.addEventListener("mouseenter", () => {
        ecosystem.InputValues.mouseOverCanvas = true;
    });
    ecosystem.canvas.addEventListener("mouseleave", () => {
        ecosystem.InputValues.mouseOverCanvas = false;
    });
}

export function ButtonClickWasLeftMouse(vec2WInfo: any): boolean {
    return vec2WInfo.buttonIndex === 0;
}

export function ButtonClickWasRightMouse(vec2WInfo: any): boolean {
    return vec2WInfo.buttonIndex === 2;
}

export function UpdateInputValues(ecosystem: GameEcosystem) {
    if (ecosystem.dynamicProperties[dynamicpropertyDSM] === undefined) {
        console.error("No device manager for input! Did you call SetupDeviceManager?");
        return;
    }
    const dsm = ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager;

    UpdateDynamicTextureChecks(ecosystem);
    const scaling = ecosystem.scene.getEngine().getHardwareScalingLevel();
    ecosystem.InputValues.mouseUnscaledXPosition = ecosystem.scene.pointerX;
    ecosystem.InputValues.mouseUnscaledYPosition = ecosystem.scene.pointerY;
    ecosystem.InputValues.mouseScaledXPosition = ecosystem.scene.pointerX / scaling;
    ecosystem.InputValues.mouseScaledYPosition = ecosystem.scene.pointerY / scaling;

    //TODO what if not keyboard mouse (eg touch or gamepad)

    //Get all keyboard values
    if (dsm.getDeviceSource(DeviceType.Keyboard)) {
        for (const key in ecosystem.InputValues) {
            if (ecosystem.InputValues.hasOwnProperty(key)) {
                const value = ecosystem.InputValues[key as keyof WindowInputValues];
                if (value instanceof ButtonInput) {
                    value.UpdateValue(ecosystem);
                } else if (value instanceof AxisInput) {
                    value.UpdateValue(ecosystem);
                }
            }
        }
    }
    //Get all mouse values
    if (dsm.getDeviceSource(DeviceType.Mouse)) {
        var PrimClickMade = dsm.getDeviceSource(DeviceType.Mouse).getInput(BrowserKeyNameValues.LEFTMOUSE);
        //Block click if over UI
        if (PrimClickMade === 1 && ecosystem.InputValues.primaryClick.wasActive === false) {
            if (ecosystem.hoveredOverGUI === true) {
                PrimClickMade = 0;
            }
        }
        ecosystem.InputValues.primaryClick.setNewActivity([PrimClickMade]);
        ecosystem.InputValues.middleClick.setNewActivity([
            dsm.getDeviceSource(DeviceType.Mouse).getInput(BrowserKeyNameValues.MIDDLEMOUSE),
        ]);
        ecosystem.InputValues.secondaryClick.setNewActivity([
            dsm.getDeviceSource(DeviceType.Mouse).getInput(BrowserKeyNameValues.RIGHTMOUSE),
        ]);
    }
}

export function UpdateInputValuesEndFrame(ecosystem: GameEcosystem) {
    ecosystem.InputValues.mouseWheel = 0;

    ecosystem.InputValues.mouseYDelta = SimpleWeightedAverageSmooth(
        ecosystem.InputValues.mouseYDelta,
        frameMouseYChanges,
        ecosystem.deltaTime,
        0.02,
    );
    ecosystem.InputValues.mouseXDelta = SimpleWeightedAverageSmooth(
        ecosystem.InputValues.mouseXDelta,
        frameMouseXChanges,
        ecosystem.deltaTime,
        0.02,
    );
    frameMouseXChanges = 0;
    frameMouseYChanges = 0;
}

//Helper function for getting single keyboard val
function GetKeyboardValue(input: number, ecosystem: GameEcosystem) {
    const dsm = ecosystem.dynamicProperties[dynamicpropertyDSM] as DeviceSourceManager;
    return dsm.getDeviceSource(DeviceType.Keyboard).getInput(input);
}

let frameMouseXChanges = 0;
let frameMouseYChanges = 0;
function RecordMouseChanges(x: number, y: number) {
    frameMouseXChanges += x;
    frameMouseYChanges += y;
}
