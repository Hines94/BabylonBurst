//@ts-ignore
import { JSONEditor } from "@json-editor/json-editor";
import { MakeDroppableElement } from "@BabylonBoostClient/HTML/HTMLUtils";

interface JSONSchema {
    title?: string;
    description?: string;
    type?: "string" | "number" | "object" | "array" | "boolean" | "null";
    properties?: { [key: string]: JSONSchema };
    items?: JSONSchema | JSONSchema[];
    required?: string[];
    // ... additional properties for different schema keywords
}

class CustomStringEditor extends JSONEditor.defaults.editors.string {
    postBuild() {
        super.postBuild();
        //@ts-ignore
        MakeDroppableElement(this.input, () => this.getValue());
        setupForEditorOnly(this);
    }
}

class CustomNumberEditor extends JSONEditor.defaults.editors.number {
    postBuild() {
        super.postBuild();
        setupForEditorOnly(this);
    }
}

class CustomArrayEditor extends JSONEditor.defaults.editors.array {
    isReadOnly = false;
    rows: any;

    postBuild() {
        super.postBuild();
        this.disableIfEditor(this);
    }

    disableIfEditor(arrayEd: any) {
        if (arrayEd.original_schema.description.includes("__EDITORREADONLY__")) {
            arrayEd.isReadOnly = true;
            arrayEd.disable(true);
            removeEditorReadOnlyText(arrayEd);
            arrayEd.delete_last_row_button.remove();
            arrayEd.remove_all_rows_button.remove();
            arrayEd.add_row_button.remove();
        }
    }

    //@ts-ignore - Exists in JSONEditor arrays
    override onChange() {
        super.onChange();
        if (this.isReadOnly && this.rows !== undefined) {
            //@ts-ignore
            this.disable(true);
            for (var i = 0; i < this.rows.length; i++) {
                this.removeRowButtons(this.rows[i]);
                setInputAsReadOnly(this.rows[i].input);
            }
        }
    }

    removeRowButtons(row: any) {
        if (row.delete_button) {
            row.delete_button.remove();
        }
        if (row.movedown_button) {
            row.movedown_button.remove();
        }
        if (row.moveup_button) {
            row.moveup_button.remove();
        }
    }
}

function setupForEditorOnly(item: any) {
    if (!item.original_schema || !item.original_schema.description) {
        return;
    }
    if (item.original_schema.description.includes("__EDITORREADONLY__")) {
        const input: HTMLInputElement = item.input;
        setInputAsReadOnly(input);
        removeEditorReadOnlyText(item);
    }
}

function setInputAsReadOnly(input: HTMLInputElement) {
    input.style.backgroundColor = "darkgrey";
    input.style.color = "white";
    input.title = "Read Only";
    input.setAttribute("readonly", "true");
}

function removeEditorReadOnlyText(item: any) {
    if (item.original_schema.description) {
        const description: HTMLElement = item.description;
        description.innerText = description.innerText.replace("__EDITORREADONLY__", "");
    }
}

export function SetupCustomInspectorEditors() {
    //Custom string
    JSONEditor.defaults.editors.customString = CustomStringEditor;
    JSONEditor.defaults.editors.customNumber = CustomNumberEditor;
    JSONEditor.defaults.editors.customArray = CustomArrayEditor;
    JSONEditor.defaults.resolvers.unshift(function (schema: JSONSchema) {
        if (schema.type === "string") {
            return "customString";
        }
        if (schema.type === "number") {
            return "customNumber";
        }
        if (schema.type === "array") {
            return "customArray";
        }
    });
}
