import { DebugMode, environmentVaraibleTracker } from "../../../../Shared/src/Utils/EnvironmentVariableTracker";

export class FramerateCounter {
    // HTML elements for the framerate counter
    averageFramesElement: HTMLElement;
    lowFramesElement: HTMLElement;
    lowestFramesElement: HTMLElement;
    framesToCollect = 200;
    distFromTop = 5;

    running = false;

    constructor(doc = document) {
        // Create the elements
        this.averageFramesElement = doc.createElement("div");
        this.averageFramesElement.style.pointerEvents = "none";
        this.lowFramesElement = doc.createElement("div");
        this.lowFramesElement.style.pointerEvents = "none";
        this.lowestFramesElement = doc.createElement("div");
        this.lowestFramesElement.style.pointerEvents = "none";

        // Style the elements
        const baseStyles = {
            position: "absolute",
            right: "10px",
            color: "white",
            width: "150px",
            height: "20px",
            textAlign: "right",
            zIndex: "100",
        };

        Object.assign(this.averageFramesElement.style, baseStyles, {
            top: `${this.distFromTop}px`,
        });

        Object.assign(this.lowFramesElement.style, baseStyles, {
            top: `${this.distFromTop + 20}px`,
            color: "red",
        });

        Object.assign(this.lowestFramesElement.style, baseStyles, {
            top: `${this.distFromTop + 40}px`,
            color: "red",
        });

        // Append the elements to the body (or any other container element)
        doc.body.appendChild(this.averageFramesElement);
        doc.body.appendChild(this.lowFramesElement);
        doc.body.appendChild(this.lowestFramesElement);

        this.setDefaultVisible();
    }

    private setDefaultVisible() {
        if (environmentVaraibleTracker.GetDebugMode() < DebugMode.Light) {
            this.setHidden(true);
        } else {
            this.setHidden(false);
        }
    }

    setHidden(bHidden: boolean) {
        this.running = !bHidden;
        this.averageFramesElement.hidden = bHidden;
        this.lowFramesElement.hidden = bHidden;
        this.lowestFramesElement.hidden = bHidden;
    }

    recentFrames: number[] = [];

    private changeIfDifferent(element: HTMLElement, changed: string) {
        if (changed != element.innerText) {
            element.innerText = changed;
        }
    }

    updateFramerate(deltaTime: number) {
        if (this.running === false) {
            return;
        }
        var CalcRate = 1 / deltaTime;
        this.recentFrames.splice(0, 0, CalcRate);
        if (this.recentFrames.length > this.framesToCollect) {
            this.recentFrames = this.recentFrames.slice(0, this.framesToCollect);
        }
        //Average frames
        const average = averageArray(this.recentFrames);
        this.changeIfDifferent(this.averageFramesElement, average.toFixed(0));
        //Check bottom tanky frames
        const lowFract = averageArray(bottomFraction(this.recentFrames, 0.05));
        if (lowFract < 0.95 * average) {
            this.lowFramesElement.hidden = false;
            this.changeIfDifferent(this.lowFramesElement, "Lowest 5%: " + lowFract.toFixed(0));
        } else {
            this.lowFramesElement.hidden = true;
        }
        //Check rock bottom tanks
        const lowestFract = averageArray(bottomFraction(this.recentFrames, 0.01));
        if (lowFract < 0.9 * average) {
            this.lowestFramesElement.hidden = false;
            this.changeIfDifferent(this.lowestFramesElement, "Lowest 1%: " + lowestFract.toFixed(0));
        } else {
            this.lowestFramesElement.hidden = true;
        }
    }
}

function averageArray(numbers: number[]) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length || 0;
    return avg;
}

function bottomNumber(numbers: number[]): number {
    // Make a copy of the array
    const numbersCopy = [...numbers];
    numbersCopy.sort((a, b) => a - b);
    return numbersCopy[0];
}

function bottomFraction(numbers: number[], fract: number): number[] {
    // Make a copy of the array
    const numbersCopy = [...numbers];

    // Sort the numbers in ascending order
    numbersCopy.sort((a, b) => a - b);

    // Calculate the length of the bottom % of the array
    const bottomTenPercentLength = Math.ceil(numbersCopy.length * fract);

    // Return the bottom % of the numbers
    return numbersCopy.slice(0, bottomTenPercentLength);
}
