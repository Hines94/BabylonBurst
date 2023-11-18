export type innerOuterPanelReturn = {
    innerPanel: HTMLDivElement;
    outerPanel: HTMLDivElement;
    button: HTMLButtonElement;
};

export function GenerateInnerOuterPanelWithMinimizer(doc: Document): innerOuterPanelReturn {
    const outerPanel = doc.createElement("div");
    outerPanel.style.position = "relative";
    outerPanel.style.border = "1px solid rgba(211, 211, 211, 0.5)";
    outerPanel.style.borderRadius = "5px";
    outerPanel.style.marginTop = "10px";
    outerPanel.style.padding = "5px";
    const innerPanel = doc.createElement("div");
    const closer = doc.createElement("button");
    closer.innerText = " _ ";
    closer.style.borderRadius = "2px";
    closer.style.padding = "5px";
    closer.style.paddingRight = "10px";
    closer.style.paddingLeft = "10px";
    closer.addEventListener("click", () => {
        if (innerPanel.classList.contains("hidden")) {
            innerPanel.classList.remove("hidden");
        } else {
            innerPanel.classList.add("hidden");
        }
    });
    const closerContainer = doc.createElement("div");
    closerContainer.style.position = "absolute";
    closerContainer.style.right = "10px";
    closerContainer.style.top = "0px";
    closerContainer.style.padding = "5px";
    closerContainer.appendChild(closer);
    outerPanel.appendChild(closerContainer);
    outerPanel.appendChild(innerPanel);
    return { innerPanel: innerPanel, outerPanel: outerPanel, button: closer };
}

/** Make an element sit on the cursor position */
export function SetupElementToCursor(cursorPos: { x: number; y: number }, item: HTMLElement) {
    item.style.position = "absolute";
    item.style.zIndex = "1000";

    // Get the click coordinates
    var clickX = cursorPos.x;
    var clickY = cursorPos.y;

    // Get the dimensions of the window
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    // Get the dimensions of the context menu
    var contextMenuWidth = item.offsetWidth;
    var contextMenuHeight = item.offsetHeight;

    // Determine where to display the context menu
    if (clickX > windowWidth / 2) {
        // On the right half of the screen, make it go left
        item.style.left = clickX - contextMenuWidth + "px";
    } else {
        // On the left half of the screen
        item.style.left = clickX + "px";
    }

    if (clickY > windowHeight / 2) {
        // On the bottom half of the screen, make it go upwards
        item.style.top = clickY - contextMenuHeight + "px";
    } else {
        // On the top half of the screen
        item.style.top = clickY + "px";
    }
}

/** Given a blob in our window create one in another */
export async function CreateBlobInNewWindow(newWindow: any, blobURL: any, blob: any) {
    try {
        console.log("Attempting to create new blob in new window");

        // Check if the function doesn't exist in the new window and inject it if necessary
        if (typeof newWindow.createBlobInNewWindow !== "function") {
            const script = newWindow.document.createElement("script");
            script.textContent = `
                window.createBlobInNewWindow = function (rawData, blobType) {
                    console.log('Creating blob within new window context');
                    const newBlob = new Blob([rawData], { type: blobType });
                    return URL.createObjectURL(newBlob);
                };
            `;
            newWindow.document.head.appendChild(script);
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for the script to be evaluated
        }

        const rawData = await blob.arrayBuffer();
        const newBlobURL = newWindow.createBlobInNewWindow(rawData, blob.type);

        if (!newBlobURL) {
            throw new Error("Failed to create blob URL in new window.");
        }

        console.log("New blob URL created in new window:", newBlobURL);

        // Store and return the new blob URL for future reference
        if (!newWindow.CONVERTEDBLOBS) {
            newWindow.CONVERTEDBLOBS = {};
        }
        newWindow.CONVERTEDBLOBS[blobURL] = newBlobURL;

        return newBlobURL;
    } catch (error) {
        console.error("Error creating blob in new window:", error);
        return undefined;
    }
}

export function isAttachedToDOM(element: HTMLElement) {
    if (element.ownerDocument === undefined || element.ownerDocument === null) {
        return false;
    }
    return element.ownerDocument.body.contains(element);
}

export function DeepEquals(obj1: any, obj2: any, excludeKeysCallback: (keys: string[]) => string[] = undefined) {
    // If both are the same instance, return true
    if (obj1 === obj2) return true;

    // If one of them is null or undefined but not the other, return false
    if (!obj1 || !obj2) return false;

    // If objects are not of type "object", compare them directly
    const obj1T = typeof obj1;
    const obj2T = typeof obj2;

    if (obj1T !== obj2T) {
        return false;
    }

    if (obj1T !== "object" || obj2T !== "object") {
        if (obj1T === "number" && obj2T === "number") {
            return obj1.toFixed(10) === obj2.toFixed(10);
        }
        return obj1 === obj2;
    }

    //Array case
    if (Array.isArray(obj1) || Array.isArray(obj2)) {
        if (Array.isArray(obj1) !== Array.isArray(obj2)) {
            return false;
        }
        if (obj1.length !== obj2.length) {
            return false;
        }
        for (var i = 0; i < obj1.length; i++) {
            if (!DeepEquals(obj1[i], obj2[i])) {
                return false;
            }
        }
    }

    // Get the keys of both objects
    var keys1 = Object.keys(obj1);
    var keys2 = Object.keys(obj2);

    if (excludeKeysCallback) {
        keys1 = excludeKeysCallback(keys1);
        keys2 = excludeKeysCallback(keys2);
    }

    // If they don't have the same number of keys, they are not equal
    if (keys1.length !== keys2.length) {
        return false;
    }

    // If any key is missing in the second object or its value is different from the first, return false
    for (let key of keys1) {
        if (!keys2.includes(key) || !DeepEquals(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export function BlobToString(blob: any) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function () {
            resolve(undefined);
        };

        reader.readAsText(blob);
    });
}

export async function CopyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        console.log("Text copied to clipboard");
    } catch (err) {
        console.error("Failed to copy text: ", err);
    }
}
