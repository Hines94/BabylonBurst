import { GameEcosystem } from "@BabylonBoostClient/GameEcosystem";

export function AddOptionToEditorTopMenu(
    ecosystem: GameEcosystem,
    menuName: string,
    elementName: string
): HTMLLIElement {
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

    constructor(ecosystem: GameEcosystem, name: string) {
        this.ecosystem = ecosystem;
        this.topBar = ecosystem.doc.getElementById("editorHeaderPanel");
        this.name = name;
        this.setupEditorMenu();
    }

    GetMenuOption(optionName: string): HTMLLIElement {
        const topMenu = this;
        //Split on subfolders
        const subs = optionName.split("/");
        var folderLevel:any = this.dropdownContent;
        if(subs.length > 1) {
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
                    if (!holderElement.elements) { holderElement.elements = []; }
                    folderLevel.appendChild(listEle);
                }
                //Set new Level we are at
                folderLevel = folderLevel.elements[folderName];
            }
            optionName = subs[subs.length-1];
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
        const itembutton = this.ecosystem.doc.createElement("button");
        itembutton.innerText = this.name;
        this.topLevelHolder.appendChild(itembutton);
        this.dropdownContent = this.ecosystem.doc.createElement("div");
        this.dropdownContent.className = "dropdown-content";
        (this.dropdownContent as any).elements = [];
        this.topLevelHolder.appendChild(this.dropdownContent);
        this.topBar.appendChild(this.topLevelHolder);
    }

    dispose() {
        this.topLevelHolder.remove();
    }
}
