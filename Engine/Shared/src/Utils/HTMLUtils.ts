
export type innerOuterPanelReturn = {innerPanel:HTMLDivElement,outerPanel:HTMLDivElement,button:HTMLButtonElement};

export function GenerateInnerOuterPanelWithMinimizer(doc:Document):innerOuterPanelReturn {
    const outerPanel = doc.createElement("div");
    outerPanel.style.position = "relative";
    const innerPanel = doc.createElement("div");
    const closer = doc.createElement("button");
    closer.innerText = " _ ";
    closer.style.borderRadius = "2px";
    closer.style.padding = "5px";
    closer.style.paddingRight = "10px";
    closer.style.paddingLeft = "10px";
    closer.addEventListener("click",()=>{
        if(innerPanel.classList.contains("hidden")) {
            innerPanel.classList.remove("hidden");
        } else {
            innerPanel.classList.add("hidden");
        }
    })
    const closerContainer = doc.createElement("div");
    closerContainer.style.position = "absolute";
    closerContainer.style.right = "10px";
    closerContainer.style.top = "10px";
    closerContainer.style.padding = "5px";
    closerContainer.appendChild(closer);
    outerPanel.appendChild(closerContainer);
    outerPanel.appendChild(innerPanel);
    return {innerPanel:innerPanel,outerPanel:outerPanel,button:closer};
}

export function isAttachedToDOM(element:HTMLElement) {
    if(element.ownerDocument === undefined || element.ownerDocument === null) {
        return false;
    }
    return element.ownerDocument.body.contains(element);
}

export function DeepEquals(obj1, obj2) {
    // If both are the same instance, return true
    if (obj1 === obj2) return true;

    // If one of them is null or undefined but not the other, return false
    if (!obj1 || !obj2) return false;

    // If objects are not of type "object", compare them directly
    const obj1T = typeof obj1;
    const obj2T = typeof obj2;

    if(obj1T !== obj2T) {
        return false;
    }

    if (obj1T !== 'object' || obj2T  !== 'object') { 
        if(obj1T === "number" && obj2T === "number") {
            return obj1.toFixed(10) === obj2.toFixed(10);
        }
        return obj1 === obj2; 
    }

    //Array case
    if(Array.isArray(obj1) || Array.isArray(obj2)) {
        if(Array.isArray(obj1) !== Array.isArray(obj2)) {
            return false;
        }
        if(obj1.length !== obj2.length) {
            return false;
        }
        for(var i = 0; i < obj1.length;i++) {
            if(!DeepEquals(obj1[i],obj2[i])) {
                return false;
            }
        }
    }

    // Get the keys of both objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // If they don't have the same number of keys, they are not equal
    if (keys1.length !== keys2.length) return false;

    // If any key is missing in the second object or its value is different from the first, return false
    for (let key of keys1) {
        if (!keys2.includes(key) || !DeepEquals(obj1[key], obj2[key])) return false;
    }

    return true;
}

export async function CopyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text copied to clipboard');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}