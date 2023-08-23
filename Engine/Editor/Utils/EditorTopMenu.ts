import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";

export function AddOptionToEditorTopMenu(
    ecosystem: GameEcosystem,
    menuName: string,
    elementName: string
): HTMLParagraphElement {
    const menu = ensureEditorMenu(ecosystem, menuName);
    return menu.GetMenuOption(elementName);
}

function ensureEditorMenu(ecosystem: GameEcosystem, menuName: string): EditorTopMenu {
    if (!ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName]) {
        ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName] = new EditorTopMenu(ecosystem, menuName);
    }
    return ecosystem.dynamicProperties["__EDTORTOPMENU___" + menuName];
}

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

    elements: { [name: string]: HTMLParagraphElement } = {};

    constructor(ecosystem: GameEcosystem, name: string) {
        this.ecosystem = ecosystem;
        this.topBar = ecosystem.doc.getElementById("editorHeaderPanel");
        this.name = name;
        this.setupEditorMenu();
    }

    GetMenuOption(optionName: string): HTMLParagraphElement {
        if (this.elements[optionName]) {
            return this.elements[optionName];
        }
        const newElement = this.ecosystem.doc.createElement("p");
        newElement.innerText = optionName;
        this.dropdownContent.appendChild(newElement);
        this.elements[optionName] = newElement;
        return newElement;
    }

    private setupEditorMenu() {
        this.topLevelHolder = this.ecosystem.doc.createElement("div");
        this.topLevelHolder.className = "dropdown";
        const itembutton = this.ecosystem.doc.createElement("button");
        itembutton.innerText = this.name;
        this.topLevelHolder.appendChild(itembutton);
        this.dropdownContent = this.ecosystem.doc.createElement("div");
        this.dropdownContent.className = "dropdown-content";
        this.topLevelHolder.appendChild(this.dropdownContent);
        this.topBar.appendChild(this.topLevelHolder);
    }

    dispose() {
        this.topLevelHolder.remove();
    }
}
