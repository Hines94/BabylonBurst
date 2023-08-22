export function CloneTemplate(templateName: string, doc = document): HTMLElement {
    const template = doc.getElementById(templateName) as HTMLTemplateElement;
    if (template === null) {
        console.error("Can't find template: " + templateName);
        return doc.createElement("div");
    }
    const elementItem = template.content.cloneNode(true) as HTMLElement;
    const container = doc.createElement("div");
    container.appendChild(elementItem);
    return container;
}

export function PreventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
}

/** Will add 1 then 2 then 3 etc until find unused name */
export function GetNewNameItem(object: any, baseName: string) {
    var newName = baseName;
    var offset = 0;
    while (object[newName]) {
        offset++;
        newName = baseName + offset;
    }
    return newName;
}

export function WaitForEvent(eventName: string, doc: Document) {
    return new Promise(resolve => {
        doc.addEventListener(
            eventName,
            event => {
                resolve(event);
            },
            { once: true }
        );
    });
}

/** Method to make text input accept drag/drop text and highlight on hover */
export function MakeDroppableElement(element: HTMLInputElement, getData: () => string) {
    element.addEventListener("dragover", function (event: DragEvent) {
        event.preventDefault();
        element.classList.add("dragover");
    });

    element.addEventListener("dragleave", function (event: DragEvent) {
        element.classList.remove("dragover");
    });

    element.addEventListener("drop", function (event: DragEvent) {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        element.value += data; // Append the dropped text to the current value
        element.classList.remove("dragover");
    });
}

export function MakeDraggableElement(element: HTMLElement, getData: () => string) {
    var clone: HTMLElement;
    let offsetX = 0;
    let offsetY = 0;

    element.setAttribute("draggable", "true");
    element.addEventListener("dragstart", dragStart);
    element.addEventListener("drag", dragMiddle);
    element.addEventListener("dragend", dragEnd);

    function dragStart(event: DragEvent) {
        clone = element.cloneNode(true) as HTMLElement; // clone the element
        clone.style.position = "absolute";
        clone.style.pointerEvents = "none"; // disable pointer events
        clone.style.zIndex = "20000";
        clone.style.height = element.clientHeight * 0.5 + "px";
        clone.style.width = element.clientHeight * 0.5 + "px";
        clone.style.border = "1px solid lightgray";
        document.body.appendChild(clone);

        offsetX = event.clientX - element.getBoundingClientRect().left;
        offsetY = event.clientY - element.getBoundingClientRect().top;

        event.dataTransfer.setData("text/plain", getData());
        event.dataTransfer.effectAllowed = "link";
        event.dataTransfer.setDragImage(new Image(), 0, 0); // hide the default drag image
    }

    function dragMiddle(event: DragEvent) {
        if (clone) {
            const left = event.x;
            const top = event.y;
            clone.style.left = `${left}px`;
            clone.style.top = `${top}px`;
            if (left === 0 && top === 0) {
                clone.style.display = "none";
            } else {
                clone.style.display = "block";
            }
        }
    }

    function dragEnd(event: DragEvent) {
        if (clone) {
            clone.remove();
            clone = null;
        }
    }
}

/** Find all elements with a class and remove it */
export function RemoveClassFromAllItems(removeclass: string, owner: HTMLElement): number {
    const allSelected = owner.querySelectorAll("." + removeclass);
    allSelected.forEach(ele => {
        ele.classList.remove(removeclass);
    });
    return allSelected.length;
}
