
import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { CloneTemplate } from "@BabylonBurstClient/HTML/HTMLUtils";
import { HigherarchyHTML } from "./HigherarchyHTML";
import { EntityData } from "@engine/EntitySystem/EntityData";
import { Component } from "@engine/EntitySystem/Component";
import { registeredTypes, savedProperties, savedProperty } from "@engine/EntitySystem/TypeRegister";
import { DeepEquals, GenerateInnerOuterPanelWithMinimizer, isAttachedToDOM } from "@engine/Utils/HTMLUtils"
import { GenerateEditorProperty } from "../InspectorWindow/CustomInspectorComponents";
import { GetAllComponentClassTypes } from "@engine/Utils/TypeRegisterUtils"
import { DeepCopier, Observable, Observer } from "@babylonjs/core";
import { GetCustomSaveData } from "@engine/Utils/SaveableDataUtils";

/** Responsible for showing entity components in inspector window */
export class EntityInspectorHTML {
    owner: HigherarchyHTML;
    entityId: number;
    inspector: HTMLElement;
    defaultEntityData:EntityData;
    observer:Observer<number>;

    constructor(owner: HigherarchyHTML, entityIdentifier: number) {
        this.owner = owner;
        this.entityId = entityIdentifier;

        this.observer = owner.ecosystem.entitySystem.onEntityRemovedEv.add(this.entityRemoved.bind(this));

        this.inspector = this.owner.windowDoc.getElementById("InspectorPanel") as HTMLElement;
        this.inspector.classList.remove("hidden");
        this.inspector.innerHTML = "";

        //Entity inspection template
        const entTemplate = CloneTemplate("EntityInspector", this.owner.windowDoc);
        entTemplate.querySelector("#EntityTitle").innerHTML = "Entity: " + entityIdentifier;

        //Existing items
        const allEntComps = entTemplate.querySelector("#EntityComponents") as HTMLElement;
        this.defaultEntityData = owner.ecosystem.entitySystem.GetEntityData(entityIdentifier);
        const entityData = owner.ecosystem.entitySystem.GetEntityData(this.entityId);
        entityData.Components.forEach(comp => {
            this.addComponentToInspector(comp, allEntComps, entityIdentifier);
        });

        //New Component
        const possibleComps = GetAllComponentClassTypes();
        const compTypes = entTemplate.querySelector("#componentTypes");
        possibleComps .forEach(comp => {
            if(!comp.options.bEditorAddable) {
                return;
            }
            const newOpt = this.owner.windowDoc.createElement("option");
            newOpt.value = comp.type.name;
            compTypes.appendChild(newOpt);
        });
        const selectComp = entTemplate.querySelector("#AddComponentSubmit");
        const newCompType = entTemplate.querySelector("#addComponent") as HTMLInputElement;

        //Add new component
        selectComp.addEventListener("click", () => {
            const compTypeName = newCompType.value;

            //Already added?
            if (entityData.GetComponentByName(compTypeName) !== undefined) {
                ShowToastNotification(`Component ${compTypeName} already added!`, 3000, this.owner.windowDoc, "red");
                newCompType.value = "";
                return;
            }

            const type = possibleComps.find(p => p.type.name === compTypeName);
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

        this.inspector.appendChild(entTemplate);
    }

    entityRemoved(ent:number) {
        if(ent === this.entityId) {
            this.dispose();
        }
    }

    addComponentToInspector(comp: Component, inspector: HTMLElement, entityId: number, componentInner = undefined) {
        const compName = comp.constructor.name;
        if(!registeredTypes[compName]) {
            console.error("No schema for component: " + compName);
            return;
        }

        const higherarch = this;
        //Need to re-setup?
        if(componentInner === undefined) {
            const componentWrapper = GenerateInnerOuterPanelWithMinimizer(inspector.ownerDocument);
            componentWrapper.outerPanel.classList.add("Component");
            const title = inspector.ownerDocument.createElement("h2");
            title.textContent = compName;
            componentWrapper.outerPanel.insertBefore(title,componentWrapper.innerPanel);
            componentWrapper.outerPanel.style.backgroundColor = inspector.children.length % 2 === 1 ? "#2a2c2e" : "#151517";
            componentWrapper.innerPanel.classList.add("hidden");
            
            if(registeredTypes[compName].options.bEditorRemovable) {
                const removeButton = document.createElement("button");
                removeButton.style.marginLeft = "5px";
                removeButton.innerText = "X";
                componentWrapper.button.parentElement.appendChild(removeButton);
                removeButton.onclick = () => {
                    higherarch.owner.ecosystem.entitySystem.RemoveComponent(entityId,compName);
                    componentWrapper.outerPanel.remove();
                };
            }
            inspector.appendChild(componentWrapper.outerPanel);

            componentInner = componentWrapper.innerPanel;
        } else {
            componentInner.innerHTML = "";
        }

        const requireRefreshEvent = new Observable<void>();
        
        const compSavedProps = savedProperties[compName];
        for(var c = 0; c < compSavedProps.length;c++) {
            const property = compSavedProps[c];
            GenerateEditorProperty(componentInner,property,comp,(v)=>{comp[property.name] = v;},this.owner.ecosystem,requireRefreshEvent);
        }

        //TODO: Poll
        setTimeout(()=>{
            const checkpointedData = GetCustomSaveData(undefined,this.owner.ecosystem.entitySystem.GetEntityData(this.entityId),comp,false,[]);
            this.pollComponentRefresh(comp,checkpointedData,requireRefreshEvent);
        },200);
    }

    pollComponentRefresh(comp: Component, lastCompData:any, refreshRequireEv:Observable<void>) {
        if(this.entityId === undefined) {
            return;
        }
        const newCheckpoint = GetCustomSaveData(undefined,this.owner.ecosystem.entitySystem.GetEntityData(this.entityId),comp,false,[]);
        
        // Check the value
        if(!DeepEquals(newCheckpoint,lastCompData)) {
            refreshRequireEv.notifyObservers();
        }

        // Schedule the next poll
        setTimeout(() => {
            this.pollComponentRefresh(comp,newCheckpoint,refreshRequireEv);
        }, 200); 
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

    dispose() {
        if (this.inspector) {
            this.inspector.innerHTML = "";
            this.inspector.classList.add("hidden");
        }
        this.entityId = undefined;
        if(this.observer) {
            this.owner.ecosystem.entitySystem.onEntityRemovedEv.remove(this.observer);
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