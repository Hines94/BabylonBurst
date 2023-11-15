import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { registeredTypes, savedProperties, savedProperty } from "@engine/EntitySystem/TypeRegister";
import { GameEcosystem } from "@engine/GameEcosystem";
import { GenerateInnerOuterPanelWithMinimizer, isAttachedToDOM } from "@engine/Utils/HTMLUtils";
import { ProcessInstancedRenderComp } from "./CustomInstancedRendererComponent";
import { ProcessModelSpecifierComp } from "./CustomModelSpecifier";
import { IsEnumType, IsIntArrayType, isTypeAClass } from "@engine/Utils/TypeRegisterUtils";
import { ProcessMaterialSpecifierComp } from "./CustomMaterialSpecifier";
import { ProcessPrefabSpecifierComp } from "./CustomPrefabIdentifier";
import { Observable } from "@babylonjs/core";
import { ProcessUISpecifierComp } from "./CustomUISpecifier";

export type editorPropertyCallback = (
    container: HTMLElement,
    propType: savedProperty,
    parentData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
) => boolean;
var registeredEditorPropertyCallbacks: editorPropertyCallback[] = [];
export function RegisterCustomEditorPropertyGenerator(callback: editorPropertyCallback) {
    registeredEditorPropertyCallbacks.push(callback);
}

//Register engine callbacks
RegisterCustomEditorPropertyGenerator(ProcessInstancedRenderComp);
RegisterCustomEditorPropertyGenerator(ProcessModelSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessMaterialSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessPrefabSpecifierComp);
RegisterCustomEditorPropertyGenerator(ProcessUISpecifierComp);

type ArrayElementSpecifier = {
    ele: HTMLButtonElement;
    clickEv: any;
    changeEvent: (any) => void;
    mainProperty: any;
};

export function GenerateEditorProperty(
    container: HTMLElement,
    propType: savedProperty,
    parentData: any,
    changeCallback: (any) => void,
    ecosystem: GameEcosystem,
    requireRefresh: Observable<void>,
) {
    if (parentData === undefined) {
        console.error("No parent data for " + propType.name);
        return;
    }

    var existingData = parentData[propType.name];

    //Create comment and title for our element
    const generatedTitle = container.ownerDocument.createElement("p");
    generatedTitle.innerText = propType.name;
    generatedTitle.id = "GeneratedTitle";
    generatedTitle.classList.add("Property");
    container.appendChild(generatedTitle);

    var generatedComment: HTMLElement = undefined;
    if (propType.options.comment) {
        generatedComment = container.ownerDocument.createElement("p");
        generatedComment.id = "GeneratedComment";
        generatedComment.innerText = propType.options.comment;
        generatedComment.classList.add("Comment");
        container.appendChild(generatedComment);
    }

    //Array
    if (Array.isArray(existingData)) {
        const arrayContainer = container.ownerDocument.createElement("div");
        container.appendChild(arrayContainer);

        const removeButtons: ArrayElementSpecifier[] = [];

        //Container that all our values will be stored in
        const valuesContainer = container.ownerDocument.createElement("div");
        valuesContainer.style.minHeight = "20px";
        valuesContainer.style.marginBottom = "10px";
        valuesContainer.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
        valuesContainer.style.width = "90%";
        valuesContainer.style.marginLeft = "5%";
        arrayContainer.appendChild(valuesContainer);
        valuesContainer.innerHTML = "";

        for (var i = 0; i < existingData.length; i++) {
            GenerateArrayElement(i, removeButtons, valuesContainer);
        }

        requireRefresh.add(() => {
            valuesContainer.innerHTML = "";
            removeButtons.splice(0, removeButtons.length);
            for (var i = 0; i < parentData[propType.name].length; i++) {
                GenerateArrayElement(i, removeButtons, valuesContainer);
            }
        });

        if (!propType.options.editorViewOnly) {
            //Create buttons to add and remove elements
            const buttonsContainer = container.ownerDocument.createElement("div");
            buttonsContainer.style.marginTop = "20px";
            buttonsContainer.style.marginLeft = "3%";
            buttonsContainer.style.marginRight = "3%";
            arrayContainer.appendChild(buttonsContainer);

            const addButton = container.ownerDocument.createElement("button");
            addButton.textContent = "+";
            addButton.style.width = "50%";
            addButton.addEventListener("click", () => {
                //Auto refresh system should pickup the changes
                existingData.push(new propType.type());
            });
            buttonsContainer.appendChild(addButton);
            const clearButton = container.ownerDocument.createElement("button");
            clearButton.textContent = "Clear";
            clearButton.style.width = "50%";
            clearButton.addEventListener("click", () => {
                if (container.ownerDocument.defaultView.confirm(`Clear the array ${propType.name}?`)) {
                    existingData.splice(0, existingData.length);
                    valuesContainer.innerHTML = "";
                    removeButtons.splice(0, removeButtons.length);
                }
            });
            buttonsContainer.appendChild(clearButton);
        }

        return;
    }

    //Custom  callbacks
    for (var i = 0; i < registeredEditorPropertyCallbacks.length; i++) {
        if (
            registeredEditorPropertyCallbacks[i](
                container,
                propType,
                parentData,
                changeCallback,
                ecosystem,
                requireRefresh,
            )
        ) {
            return;
        }
    }

    //String
    if (propType.type === String || IsIntArrayType(propType.type)) {
        generateBasicInput(
            container,
            parentData,
            propType,
            input => {
                changeCallback(input.value);
            },
            requireRefresh,
        );
        //Number
    } else if (propType.type === Number) {
        const input = generateBasicInput(
            container,
            parentData,
            propType,
            input => {
                changeCallback(parseFloat(input.value));
            },
            requireRefresh,
        );
        if (input.value === "") {
            input.value = "0";
        }
        input.type = "number";
        //TODO: min max/slider?
        //Entity Data
    } else if (propType.type === EntityData) {
        const callback = (input: HTMLInputElement) => {
            if (input.valueAsNumber === undefined || input.valueAsNumber === null || input.valueAsNumber === 0) {
                changeCallback(undefined);
            } else {
                var val = ecosystem.entitySystem.GetEntityData(input.valueAsNumber);
                if (val === undefined) {
                    ShowToastNotification(`Entity ${input.valueAsNumber} does not exist! will be undefined`);
                }
                changeCallback(val);
            }
        };
        const input = generateBasicInput(container, parentData, propType, callback, undefined);
        refreshEntityData(input);
        requireRefresh.add(() => {
            refreshEntityData(input);
        });
        input.type = "number";
        //Boolean
    } else if (propType.type === Boolean) {
        const callback = (input: HTMLInputElement) => {
            if (input.checked) {
                changeCallback(true);
            } else {
                changeCallback(false);
            }
        };
        const input = generateBasicInput(container, parentData, propType, callback, requireRefresh);
        input.type = "checkbox";
        input.style.width = "25px";
        input.style.height = "25px";
        input.checked = parentData[propType.name] === true;

        //Nested objects
    } else if (isTypeAClass(propType.type)) {
        const subType = registeredTypes[propType.type.name];
        if (subType === undefined) {
            console.error(
                `Property type ${propType.type.name} - ${propType.name} is not a registered type! Won't display in editor!`,
            );
            return;
        }
        //Ensure we have an object to set into
        if (existingData === undefined) {
            const spawnSubType = subType.type;
            //@ts-ignore
            changeCallback(new spawnSubType());
            existingData = spawnSubType;
        }
        const nestedWrapper = GenerateInnerOuterPanelWithMinimizer(container.ownerDocument);
        nestedWrapper.outerPanel.style.width = "96%";
        nestedWrapper.outerPanel.style.marginLeft = "3%";

        //Title for our new nested element
        const title = container.ownerDocument.createElement("h3");
        title.innerText = propType.name;
        generatedTitle.remove();

        //Optional comment
        const comment = propType.options.comment || subType.options.comment;
        if (comment) {
            const comment = container.ownerDocument.createElement("p");
            comment.innerText = propType.options.comment;
            nestedWrapper.outerPanel.insertBefore(comment, nestedWrapper.innerPanel);
            nestedWrapper.outerPanel.insertBefore(title, comment);
            generatedComment.remove();
        } else {
            nestedWrapper.outerPanel.insertBefore(title, nestedWrapper.innerPanel);
        }

        nestedWrapper.innerPanel.classList.add("hidden");

        container.appendChild(nestedWrapper.outerPanel);
        const compSavedProps = savedProperties[subType.type.name];
        for (var c = 0; c < compSavedProps.length; c++) {
            const property = compSavedProps[c];
            GenerateEditorProperty(
                nestedWrapper.innerPanel,
                property,
                existingData,
                val => {
                    existingData[property.name] = val;
                },
                ecosystem,
                requireRefresh,
            );
        }
    } else if (IsEnumType(propType.type)) {
        //Create a select
        const select = container.ownerDocument.createElement("select");
        select.style.marginLeft = "10%";
        const keys = Object.keys(propType.type);
        for (var k = 0; k < keys.length; k++) {
            const keyAsVal = parseInt(propType.type[keys[k]]);
            if (typeof keys[k] === "string" && isNaN(+keys[k])) {
                const option = container.ownerDocument.createElement("option");
                option.value = keyAsVal.toString();
                option.innerText = keys[k];
                select.appendChild(option);
            }
        }
        container.appendChild(select);
        select.value = parentData[propType.name];

        select.addEventListener("change", val => {
            parentData[propType.name] = select.value;
        });
        //Fail
    } else {
        console.error(`No editor input setup for ${propType.type.name} - prop name ${propType.name}`);
    }

    function refreshEntityData(input: HTMLInputElement) {
        if (parentData[propType.name] !== undefined) {
            input.value = (parentData[propType.name] as EntityData).EntityId.toString();
        } else {
            input.value = "0";
        }
    }

    function GenerateArrayElement(
        index: number,
        removeButtons: ArrayElementSpecifier[],
        valuesContainer: HTMLDivElement,
    ) {
        const arrayElementContainer = container.ownerDocument.createElement("div");
        const newEle: ArrayElementSpecifier = {
            ele: undefined,
            changeEvent: undefined,
            clickEv: undefined,
            mainProperty: parentData[propType.name],
        };
        const arraySpecificElement = Object.assign({}, propType);
        arraySpecificElement.name = index.toString();
        GenerateEditorProperty(
            arrayElementContainer,
            arraySpecificElement,
            parentData[propType.name],
            val => {
                newEle.changeEvent(val);
            },
            ecosystem,
            requireRefresh,
        );
        GenerateArrayRemoveButton(index, propType, removeButtons, arrayElementContainer, newEle);
        valuesContainer.appendChild(arrayElementContainer);
    }

    function GenerateArrayRemoveButton(
        index: number,
        propType: savedProperty,
        removeButtons: ArrayElementSpecifier[],
        elementContainer: HTMLDivElement,
        newElementData: ArrayElementSpecifier,
    ) {
        const removeButton = container.ownerDocument.createElement("button");
        newElementData.ele = removeButton;
        newElementData.clickEv = undefined;
        newElementData.changeEvent = undefined;
        removeButtons.push(newElementData);
        removeButton.style.width = `100%`;
        GenerateArrayRemoveEvent(index, removeButtons);
        if (!propType.options.editorViewOnly) {
            elementContainer.appendChild(removeButton);
        }
    }

    function GenerateArrayRemoveEvent(index: number, removeButtons: ArrayElementSpecifier[]) {
        removeButtons[index].ele.innerText = "Remove: " + index;
        if (removeButtons[index].clickEv !== undefined) {
            removeButtons[index].ele.removeEventListener("click", removeButtons[index].clickEv);
        }
        removeButtons[index].clickEv = () => {
            if (container.ownerDocument.defaultView.confirm(`Remove element ${index}?`)) {
                existingData.splice(index, 1);
                removeButtons[index].ele.parentElement.remove();
                removeButtons.splice(index, 1);
                //Regenerate later events
                for (var b = index; b < removeButtons.length; b++) {
                    GenerateArrayRemoveEvent(b, removeButtons);
                }
            }
        };
        removeButtons[index].ele.addEventListener("click", removeButtons[index].clickEv);
        removeButtons[index].changeEvent = dat => {
            removeButtons[index].mainProperty[index] = dat;
        };
    }
}

function generateBasicInput(
    container: HTMLElement,
    parentData: any,
    propType: savedProperty,
    changeCallback: (input: HTMLInputElement) => void,
    requireRefresh: Observable<void>,
) {
    //Main input
    const input = container.ownerDocument.createElement("input");
    input.addEventListener("change", () => {
        changeCallback(input);
    });
    input.value = parentData[propType.name];
    input.style.width = "90%";
    input.style.marginTop = "0px";
    input.style.marginLeft = "5%";
    input.style.marginBottom = "20px";
    input.style.marginTop = "10px";
    if (requireRefresh !== undefined) {
        requireRefresh.add(() => {
            input.value = parentData[propType.name];
        });
    }
    if (propType.options.editorViewOnly) {
        input.disabled = true;
    }
    container.appendChild(input);
    return input;
}
