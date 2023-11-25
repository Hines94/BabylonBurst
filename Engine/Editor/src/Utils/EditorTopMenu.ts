import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";

// --------------- PRESET MENU PRIORITIES ------------------------

export const fileMenuPriority = 0;
export const buildMenuPriority = 50;
export const viewItemPriority = 100;
export const debugOptionPriority = 150;
export const gizmosPriority = 200;

// ---------------------------------------------------------------

export function AddOptionToEditorTopMenu(
    ecosystem: GameEcosystem,
    menuName: string,
    elementName: string,
    priority: number,
): HTMLLIElement {
    const menu = ensureEditorMenu(ecosystem, menuName, priority);
    return menu.GetMenuOption(elementName);
}

export function AddElementToEditorTopMenu(ecosystem: GameEcosystem, element: HTMLElement, priority: number) {
    const topBar = ecosystem.doc.getElementById("editorHeaderPanel");
    element[priorityIdentifier] = priority;
    topBar.appendChild(element);
    reOrderTopBar(topBar);
}

function ensureEditorMenu(ecosystem: GameEcosystem, menuName: string, priority: number): EditorTopMenu {
    if (!ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName]) {
        ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName] = new EditorTopMenu(ecosystem, menuName, priority);
    }

    return ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName];
}

const priorityIdentifier = "___PRIORITY___";

/** A Top menu that can have dynamically added content (eg file->save etc) */
export class EditorTopMenu {
    /** The name of our menu (eg file) */
    name: string;
    ecosystem: GameEcosystem;
    /** Top bar that holds this menu */
    topBar: HTMLElement;
    /** Holds all content (eg saveas etc) */
    dropdownContent: HTMLElement;
    /** Top level for menu */
    topLevelHolder: HTMLElement;

    priority: number;

    constructor(ecosystem: GameEcosystem, name: string, priority: number) {
        this.ecosystem = ecosystem;
        this.topBar = ecosystem.doc.getElementById("editorHeaderPanel");
        if (ecosystem.isGame) {
            const rect = this.topBar.getBoundingClientRect();
            this.ecosystem.doc.getElementById("GameUI").style.top = `${rect.height}px`;
        }
        this.name = name;
        this.priority = priority;
        this.setupEditorMenu();
    }

    GetMenuOption(optionName: string): HTMLLIElement {
        const topMenu = this;
        //Split on subfolders
        const subs = optionName.split("/");
        var folderLevel: any = this.dropdownContent;
        if (subs.length > 1) {
            //For each subfolder level
            for (var s = 0; s < subs.length - 1; s++) {
                const folderName = subs[s];
                //No existing folder?
                if (!folderLevel.elements[folderName]) {
                    const listEle = topMenu.ecosystem.doc.createElement("li");
                    listEle.innerText = folderName;
                    const holderElement = topMenu.ecosystem.doc.createElement("ul") as any;
                    holderElement.classList.add("sub-menu");
                    folderLevel.elements[folderName] = holderElement;
                    listEle.appendChild(holderElement);
                    if (!holderElement.elements) {
                        holderElement.elements = [];
                    }
                    folderLevel.appendChild(listEle);
                }
                //Set new Level we are at
                folderLevel = folderLevel.elements[folderName];
            }
            optionName = subs[subs.length - 1];
        }

        //Generate bottom level item
        if (folderLevel.elements[optionName]) {
            return folderLevel.elements[optionName];
        }
        const newElement = topMenu.ecosystem.doc.createElement("li");
        newElement.innerText = optionName;
        folderLevel.appendChild(newElement);
        folderLevel.elements[optionName] = newElement;
        return newElement;
    }

    private setupEditorMenu() {
        this.topLevelHolder = this.ecosystem.doc.createElement("div");
        this.topLevelHolder.className = "dropdown";
        this.topLevelHolder[priorityIdentifier] = this.priority;
        const itembutton = this.ecosystem.doc.createElement("button");
        itembutton.innerText = this.name;
        this.topLevelHolder.appendChild(itembutton);
        this.dropdownContent = this.ecosystem.doc.createElement("div");
        this.dropdownContent.className = "dropdown-content";
        (this.dropdownContent as any).elements = [];
        this.topLevelHolder.appendChild(this.dropdownContent);
        this.topBar.appendChild(this.topLevelHolder);
        reOrderTopBar(this.topBar);
    }

    dispose() {
        this.topLevelHolder.remove();
    }
}

/** Re-order top bar items by priority */
function reOrderTopBar(topBar: HTMLElement) {
    const childElements = [...topBar.children];
    const sortedElements = childElements.sort((a, b) => {
        return a[priorityIdentifier] - b[priorityIdentifier];
    });

    sortedElements.forEach(element => {
        topBar.appendChild(element);
    });
}

/** A button that can be used to trigger an even on our top editor menu */
export function GenerateTopMenuButton(
    ecosystem: GameEcosystem,
    name: string,
    category: string,
    subfolders: string,
    priority: number,
    onCallback: (system: GameEcosystem) => void,
) {
    const propName = "___" + name + "___";
    const indicatorName = category + propName + "___BUTTON___";
    if (ecosystem.dynamicProperties[indicatorName]) {
        return;
    }
    const ddOption = AddOptionToEditorTopMenu(ecosystem, category, subfolders + name, priority);
    ddOption.classList.add("unselectable");
    ecosystem.dynamicProperties[indicatorName] = ddOption;
    ddOption.addEventListener("click", () => {
        onCallback(ecosystem);
    });
    ddOption.innerText = name;
}

/** A nice handy on/off switch to toggle effects on or off */
export function GenerateTopMenuToggle(
    ecosystem: GameEcosystem,
    name: string,
    category: string,
    subfolders: string,
    priority: number,
    onCallback: (system: GameEcosystem) => void,
    offCallback: (system: GameEcosystem) => void,
    bDefaultOn = false,
) {
    const propName = "___" + name + "___";
    const indicatorName = category + propName + "___INDICATOR___";
    if (ecosystem.dynamicProperties[indicatorName]) {
        return;
    }
    const ddOption = AddOptionToEditorTopMenu(ecosystem, category, subfolders + name, priority);
    ddOption.classList.add("unselectable");
    ecosystem.dynamicProperties[indicatorName] = ddOption;
    ddOption.addEventListener("click", () => {
        if (ecosystem.dynamicProperties[propName]) {
            ecosystem.dynamicProperties[propName] = false;
        } else {
            ecosystem.dynamicProperties[propName] = true;
        }
        RefreshEcosystemDropdownProp(ecosystem, name, category, onCallback, offCallback);
    });
    if (bDefaultOn) {
        ecosystem.dynamicProperties[propName] = true;
        RefreshEcosystemDropdownProp(ecosystem, name, category, onCallback, offCallback);
    } else {
        ddOption.innerText = name;
    }

    //Return callback to refresh easily
    return {
        refreshCallback: () => {
            RefreshEcosystemDropdownProp(ecosystem, name, category, onCallback, offCallback);
        },
        propName: propName,
    };
}

function RefreshEcosystemDropdownProp(
    ecosystem: GameEcosystem,
    name: string,
    category: string,
    onCallback: (system: GameEcosystem) => void,
    offCallback: (system: GameEcosystem) => void,
) {
    const propName = "___" + name + "___";
    const indicator = ecosystem.dynamicProperties[category + propName + "___INDICATOR___"];
    if (ecosystem.dynamicProperties[propName]) {
        indicator.innerHTML = name + " &#10003";
        onCallback(ecosystem);
    } else {
        indicator.innerHTML = name;
        offCallback(ecosystem);
    }
}
