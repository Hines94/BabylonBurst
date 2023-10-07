
import { EntitySpecification, RawEntityData } from "@BabylonBurstClient/EntitySystem/EntityMsgpackConverter";
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { CloneTemplate } from "@BabylonBurstClient/HTML/HTMLUtils";
import { GetEditorGizmos } from "./EditorGizmos";
import { HigherarchyHTML } from "./HigherarchyHTML";
//@ts-ignore
import { JSONEditor } from "@json-editor/json-editor";
import { componentSchemas, ComponentTypes } from "@BabylonBurstClient/Autogenerated/babylonburst_ServerTypings_autogenerated";
import { CheckEditorForCustomElements } from "../InspectorWindow/CustomInspectorComponents";

/** Responsible for showing entity components in inspector window */
export class EntityInspectorHTML {
    owner: HigherarchyHTML;
    entityId: number;
    inspector: HTMLElement;
    defaultEntityData: RawEntityData;

    constructor(owner: HigherarchyHTML, entityIdentifier: number) {
        this.owner = owner;
        this.entityId = entityIdentifier;

        this.inspector = this.owner.windowDoc.getElementById("InspectorPanel") as HTMLElement;
        const template = CloneTemplate("EntityInspector", this.owner.windowDoc);
        const allEntComps = template.querySelector("#EntityComponents") as HTMLElement;

        const keys = Object.keys(this.owner.allEntities);
        const entity = this.owner.allEntities[entityIdentifier];

        this.defaultEntityData = owner.ecosystem.wasmWrapper.GetDefaultComponentsForEntity(entityIdentifier);

        //Existing items
        const comps = Object.keys(entity);
        comps.forEach(comp => {
            this.addComponentToInspector(comp, allEntComps, entityIdentifier);
        });
        template.querySelector("#EntityTitle").innerHTML = "Entity: " + entityIdentifier;

        //New Component
        const compTypes = template.querySelector("#componentTypes");
        ComponentTypes.forEach(comp => {
            const newOpt = this.owner.windowDoc.createElement("option");
            newOpt.value = comp.name;
            compTypes.appendChild(newOpt);
        });
        const selectComp = template.querySelector("#AddComponentSubmit");
        const newCompType = template.querySelector("#addComponent") as HTMLInputElement;

        //Add new component
        selectComp.addEventListener("click", () => {
            const compTypeName = newCompType.value;
            //Already added?
            if (entity[compTypeName]) {
                ShowToastNotification(`Component ${compTypeName} already added!`, 3000, this.owner.windowDoc, "red");
                newCompType.value = "";
                return;
            }

            //Try get component types
            const type = ComponentTypes.find(p => p.name === compTypeName);
            if (!type) {
                ShowToastNotification(`Invalid Component Type!`, 3000, this.owner.windowDoc, "red");
            } else {
                if (this.owner.addComponentToEntity(entityIdentifier, type, allEntComps)) {
                    ShowToastNotification(`Added component ${compTypeName}`, 3000, this.owner.windowDoc);
                    this.owner.RegenerateHigherarchy();
                } else {
                    ShowToastNotification(`Could not add component ${compTypeName}`, 3000, this.owner.windowDoc, "red");
                }
            }
        });

        this.inspector.appendChild(template);
    }
    boundGizmoCallback: any;

    refreshComponentDataValues() {
        this.owner.RefreshDataToWASM();
        this.componentDatas.forEach(dat => {
            dat.editor.setValue(this.owner.allEntities[this.entityId][dat.comp]);
            this.runCustomComponentChanges(dat.comp);
            this.refreshNonDefaultValues(dat.comp, dat.editor);
        });
    }

    componentDatas: { editor: JSONEditor; comp: string }[] = [];

    addComponentToInspector(comp: string, inspector: HTMLElement, entityId: number) {
        if(!componentSchemas[comp]) {
            console.error("No schema for component: " + comp);
            return;
        }
        const schema = JSON.parse(componentSchemas[comp]);
        const componentWrapper = document.createElement("div");
        const higherarch = this;
        componentWrapper.classList.add("Component");
        inspector.appendChild(componentWrapper);
        const editor: JSONEditor = GenereateComponentEditor();

        SetupComponentEditor();

        bindCustomComponentItems();

        function BindComponentChange() {
            editor.on("change", RefreshValues());

            function RefreshValues(): any {
                return function () {
                    const newData = editor.getValue();
                    const keys = Object.keys(newData);
                    var isNew = false;
                    keys.forEach(k => {
                        if (higherarch.owner.allEntities[entityId][comp][k] !== newData[k]) {
                            isNew = true;
                        }
                    });
                    if (!isNew) {
                        return;
                    }
                    //Preserve any hidden items (eg items that have no comp typings)
                    const existingKeys = Object.keys(higherarch.owner.allEntities[entityId][comp]);
                    for(var ek = 0; ek < existingKeys.length;ek++) {
                        const existKey = existingKeys[ek];
                        if(newData[existKey] === undefined) {
                            newData[existKey] = higherarch.owner.allEntities[entityId][comp][existKey];
                        }
                    }
                    //Set new data into owner
                    higherarch.owner.allEntities[entityId][comp] = newData;
                    higherarch.owner.RefreshWASMForSpecificEntity(entityId);
                    higherarch.owner.RegenerateHigherarchy();
                    higherarch.runCustomComponentChanges(comp);
                };
            }
        }

        function SetupComponentEditor() {
            editor.on("ready", () => {
                //Start collapsed for ease
                editor.editors.root.collapse_control.click();
                const label = componentWrapper.querySelector("label");
                label.innerText = comp;

                if (comp !== "Prefab") {
                    const removeButton = document.createElement("button");
                    removeButton.innerText = "Remove";
                    removeButton.style.position = "absolute";
                    removeButton.style.right = "25px";
                    removeButton.style.fontSize = "15px";
                    removeButton.onclick = () => {
                        delete higherarch.owner.allEntities[entityId][comp];
                        componentWrapper.remove();
                        higherarch.owner.ecosystem.wasmWrapper.DelayedRemoveComponent(entityId,comp);
                        higherarch.owner.RefreshWASMForSpecificEntity(entityId);
                        higherarch.owner.RegenerateHigherarchy();
                    };
                    label.parentElement.appendChild(removeButton);
                }
                editor.setValue(higherarch.owner.allEntities[entityId][comp]);
                higherarch.componentDatas.push({ editor: editor, comp: comp });

                higherarch.refreshNonDefaultValues(comp, editor);

                CheckEditorForCustomElements(editor);

                BindComponentChange();
            });
        }

        function GenereateComponentEditor(): JSONEditor {
            return new JSONEditor(componentWrapper, {
                schema: schema,
                theme: "bootstrap5",
                iconlib: "fontawesome5",
                disable_edit_json: true,
                disable_properties: true,
                no_additional_properties: true,
                remove_empty_properties: true,
                object_layout: "normal",
                show_errors: "always",
            });
        }

        function bindCustomComponentItems() {
            if (comp === "EntTransform") {
                higherarch.boundGizmoCallback = higherarch.refreshComponentDataValues.bind(higherarch);
                GetEditorGizmos(higherarch.owner.ecosystem).changeTransformObserver.add(higherarch.boundGizmoCallback);
            }
        }
    }

    refreshNonDefaultValues(comp: string, editor: JSONEditor) {
        const ents = Object.keys(this.defaultEntityData);
        if (ents.length !== 1) {
            console.error("Default comps not one entity!");
            return;
        }
        const comps: EntitySpecification = this.defaultEntityData[parseInt(ents[0])];
        const ourComp: { [paramName: string]: any } = comps[comp];
        if (ourComp === undefined) {
            //TODO: Remove all changed indicators
            return;
        }
        const params = Object.keys(ourComp);
        for (var p = 0; p < params.length; p++) {
            const paramName = params[p];
            const ourObject = this.owner.allEntities[this.entityId][comp][paramName];
            const defaultObject = ourComp[paramName];
            this.recursiveSetNonDefaultParameters(ourObject, defaultObject, [paramName], editor, comp);
        }
    }

    runCustomComponentChanges(comp: string) {
        if (comp === "EntTransform") {
            GetEditorGizmos(this.owner.ecosystem).SetupToEntity(this.entityId);
        }
    }

    dispose() {
        if (this.inspector) {
            this.inspector.innerHTML = "";
        }
        if (this.boundGizmoCallback) {
            GetEditorGizmos(this.owner.ecosystem).changeTransformObserver.remove(this.boundGizmoCallback);
        }
    }

    /** Non default parameters - gives a handy back button */
    recursiveSetNonDefaultParameters(
        ourObject: any,
        defaultObject: any,
        previousPath: string[],
        editor: any,
        compName: string
    ) {
        const keys = Object.keys(ourObject);

        for (var k = 0; k < keys.length; k++) {
            const paramName = keys[k];

            //Not at bottom level param?
            if (typeof ourObject[paramName] === "object") {
                this.recursiveSetNonDefaultParameters(
                    ourObject[paramName],
                    defaultObject[paramName],
                    previousPath.concat([paramName]),
                    editor,
                    compName
                );
                continue;
            }

            //At bottom level param (eg number or string input)
            const rootElementHTML = editor.root_container as HTMLDivElement;
            var identifier = `#root`;
            previousPath.forEach(p => {
                identifier += `\\[${p}\\]`;
            });
            identifier += `\\[${paramName}\\]`;
            const inputElement = rootElementHTML.querySelector(identifier) as HTMLInputElement;
            if (!inputElement) {
                return;
            }

            const paramIsDefault = ourObject[paramName] === defaultObject[paramName];

            //Default parameter? Ensure no back button
            if (paramIsDefault) {
                const backButton = inputElement.parentElement.querySelector(`#BackButton`);
                if (backButton) {
                    backButton.remove();
                }
                continue;
            }

            //Non default parameter? Add a back button to reset to default
            if (!inputElement.parentElement.querySelector(`#BackButton`)) {
                const backButton = inputElement.ownerDocument.createElement("button");
                backButton.id = "BackButton";
                backButton.innerHTML = `&#x2190;`;
                const inspector = this;
                backButton.addEventListener("click", e => {
                    var objectToSet = inspector.owner.allEntities[inspector.entityId][compName];
                    previousPath.forEach(p => {
                        objectToSet = objectToSet[p];
                    });
                    objectToSet[paramName] = defaultObject[paramName];
                    inputElement.value = objectToSet[paramName];
                    backButton.remove();
                    inspector.owner.refreshInspectorIfEntity(inspector.entityId);
                    ShowToastNotification(`Reset parameter ${paramName}`, 3000, inputElement.ownerDocument);
                });
                inputElement.parentElement.appendChild(backButton);
            }
        }
    }
}
