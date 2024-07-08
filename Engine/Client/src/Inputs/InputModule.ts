import { SimpleWeightedAverageSmooth } from "../../../Shared/src/Utils/MathUtils";
import { UpdateDynamicTextureChecks } from "../GUI/AdvancedDynamicTextureTracker";
import { DeviceSourceManager, DeviceType, PointerInput, Vector2, XboxInput } from "@babylonjs/core";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { dynamicpropertyDSM } from "@BabylonBurstClient/Inputs/InputKeyNameValues";
import { ButtonInput } from "@BabylonBurstClient/Inputs/ButtonInput";
import { AxisInput } from "@BabylonBurstClient/Inputs/AxisInput";

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

    UpdateDynamicTextureChecks(ecosystem);

    //Scaled mouse
    if (ecosystem.InputValues.mouseUnscaledXPosition) {
        const scaling = ecosystem.scene.getEngine().getHardwareScalingLevel();
        ecosystem.InputValues.mouseUnscaledXPosition = ecosystem.scene.pointerX;
        ecosystem.InputValues.mouseUnscaledYPosition = ecosystem.scene.pointerY;
        ecosystem.InputValues.mouseScaledXPosition = ecosystem.scene.pointerX / scaling;
        ecosystem.InputValues.mouseScaledYPosition = ecosystem.scene.pointerY / scaling;
    }

    //Get all bind values
    for (const key in ecosystem.InputValues) {
        const value = ecosystem.InputValues[key];
        if (value instanceof ButtonInput) {
            value.UpdateValue(ecosystem);
        } else if (value instanceof AxisInput) {
            value.UpdateValue(ecosystem);
        }
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

let frameMouseXChanges = 0;
let frameMouseYChanges = 0;
function RecordMouseChanges(x: number, y: number) {
    frameMouseXChanges += x;
    frameMouseYChanges += y;
}
