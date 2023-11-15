import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { GetNewNameItem } from "@BabylonBurstClient/HTML/HTMLUtils";
import { OpenNewWindow } from "@BabylonBurstClient/HTML/HTMLWindowManager";

const existingWindowItems: { [name: string]: Window } = {};

//TODO: Create option without ability to change/save?
export async function OpenDatasheet(originalData: any, windowName: string, callback: (newData: any) => void) {
    const friendlyName = windowName.replace("_Datasheet", "");
    const Displayer = OpenNewWindow(windowName, "EditorSections/DatasheetDisplayer", "Datasheet " + friendlyName);
    if (!Displayer) {
        return;
    }
    const displayerElement = await Displayer.loadingElement;
    displayerElement.querySelector("#DatasheetName").innerHTML = "Datasheet: " + friendlyName;
    const modifyData = SetupDatasheet(displayerElement, originalData);
    const saveButton = displayerElement.querySelector("#DatasheetSave");
    saveButton.addEventListener("click", () => {
        callback(modifyData);
        setUnsavedChanges(displayerElement, false);
        ShowToastNotification("Saved Datasheet", 3000, Displayer.window.document);
    });
}

/** Setup a csv table to accept data we put to it */
export function SetupDatasheet(
    datasheetBody: HTMLElement,
    data: { [id: string]: { [key: string]: string } },
): { [id: string]: { [key: string]: string } } {
    const table = datasheetBody.querySelector("#data-table") as HTMLTableElement;
    const modifyData = JSON.parse(JSON.stringify(data));

    // Extract keys and create table headers
    const keys = Object.keys(data[Object.keys(data)[0]] || {});
    const headerRow = table.createTHead().insertRow();

    const removeCell = document.createElement("th");
    removeCell.style.backgroundColor = "#3a3a3a";
    headerRow.appendChild(removeCell);

    const idCell = document.createElement("th");
    idCell.textContent = "ID";
    idCell.style.backgroundColor = "#3a3a3a";
    headerRow.appendChild(idCell);

    const addCell = document.createElement("th");
    addCell.id = "ADDCOL";
    const addButton = document.createElement("button");
    addButton.innerText = "+";
    addCell.appendChild(addButton);
    addCell.style.backgroundColor = "#3a3a3a";
    addCell.addEventListener("click", () => {
        if (keys.includes("New Column")) {
            ShowToastNotification("Cant add new column. Please free name: 'NewColumn'");
            return;
        }
        const items = Object.keys(modifyData);
        items.forEach(item => {
            modifyData[item]["New Column"] = "";
        });
        keys.push("New Column");
        addHeaderRow("New Column", datasheetBody, headerRow, keys, modifyData);
        redrawDatasheetBody(datasheetBody, modifyData, keys);
        setUnsavedChanges(datasheetBody, true);
    });
    headerRow.appendChild(addCell);

    keys.forEach(key => {
        addHeaderRow(key, datasheetBody, headerRow, keys, modifyData);
    });

    // Create rows for each id
    redrawDatasheetBody(datasheetBody, modifyData, keys);

    //Create new row
    datasheetBody.querySelector("#CreateNewRow").addEventListener("click", ev => {
        const name = GetNewNameItem(modifyData, "NewRow");
        modifyData[name] = {};
        keys.forEach(key => {
            modifyData[name][key] = "";
        });
        redrawDatasheetBody(datasheetBody, modifyData, keys);
        setUnsavedChanges(datasheetBody, true);
        ShowToastNotification("New Row Added", 3000, datasheetBody.ownerDocument);
    });

    return modifyData;
}

function addHeaderRow(
    key: string,
    datasheetBody: HTMLElement,
    headerRow: HTMLTableRowElement,
    keys: string[],
    modifyData: any,
) {
    const headerKey = { name: key };
    const headerCell = document.createElement("th");
    //Change name
    const headerNameCell = document.createElement("input");
    headerCell.appendChild(headerNameCell);
    headerNameCell.value = headerKey.name;
    headerNameCell.addEventListener("change", function () {
        if (keys.includes(headerNameCell.value)) {
            ShowToastNotification("Cant change column. Already exists.", 3000, datasheetBody.ownerDocument);
            headerNameCell.value = headerKey.name;
            return;
        }
        const objects = Object.keys(modifyData);
        for (var i = 0; i < objects.length; i++) {
            modifyData[objects[i]][headerNameCell.value] = modifyData[objects[i]][headerKey.name];
        }
        removeColumnData();
        headerKey.name = headerNameCell.value;
    });

    //Remove row
    const removeButton = document.createElement("button");
    removeButton.textContent = "-";
    removeButton.addEventListener("click", () => {
        if (!datasheetBody.ownerDocument.defaultView.confirm("Delete Column " + headerKey.name + "?")) {
            return;
        }
        headerCell.remove();
        removeColumnData();
        redrawDatasheetBody(datasheetBody, modifyData, keys);
    });

    headerCell.appendChild(removeButton);
    headerRow.appendChild(headerCell);
    const add = datasheetBody.querySelector("#ADDCOL");
    headerRow.appendChild(add);

    function removeColumnData() {
        const index = keys.indexOf(headerKey.name);
        keys.splice(index, 1);
        const objects = Object.keys(modifyData);
        for (var i = 0; i < objects.length; i++) {
            delete modifyData[objects[i]][headerKey.name];
        }
        setUnsavedChanges(datasheetBody, true);
    }
}

function setUnsavedChanges(datasheetBody: HTMLElement, bVisible: boolean) {
    const unsavedNotification = datasheetBody.querySelector("#UnsavedIndicator");
    if (bVisible) {
        unsavedNotification.classList.remove("hidden");
    } else {
        unsavedNotification.classList.add("hidden");
    }
}

function redrawDatasheetBody(datasheetBody: HTMLElement, modifyData: any, keys: string[]) {
    const table = datasheetBody.querySelector("#data-table") as HTMLTableElement;
    const tableBody = table.getElementsByTagName("tbody")[0];
    tableBody.innerHTML = "";
    for (const id in modifyData) {
        const newRow = tableBody.insertRow();
        const idName = { name: id };

        //Remove Row
        const removeCell = newRow.insertCell();
        const removeButton = document.createElement("button");
        removeButton.innerText = "-";
        removeButton.addEventListener("click", () => {
            if (datasheetBody.ownerDocument.defaultView.confirm("Delete row " + idName.name + "?")) {
                delete modifyData[id];
                redrawDatasheetBody(datasheetBody, modifyData, keys);
                setUnsavedChanges(datasheetBody, true);
                ShowToastNotification("Row " + id + " deleted", 3000, datasheetBody.ownerDocument);
            }
        });
        removeCell.appendChild(removeButton);

        //ID
        const idCell = newRow.insertCell();
        const idInput = document.createElement("input");
        idInput.value = idName.name;
        //ID rename
        idInput.addEventListener("change", function () {
            if (modifyData[idInput.value]) {
                ShowToastNotification("Item Already Exists!");
                idInput.value = idName.name;
            }
            modifyData[idInput.value] = modifyData[idName.name];
            delete modifyData[idName.name];
            idName.name = idInput.value;
            setUnsavedChanges(datasheetBody, true);
        });
        idCell.appendChild(idInput);

        //Data keys
        keys.forEach(key => {
            const valueCell = newRow.insertCell();

            // Create an input element for editing the value
            const input = document.createElement("input");
            input.value = modifyData[idName.name][key] || "";
            input.addEventListener("change", function () {
                setUnsavedChanges(datasheetBody, true);
                // Update data object when value is changed
                modifyData[idName.name][key] = this.value;
            });
            valueCell.appendChild(input);
        });
    }
}
