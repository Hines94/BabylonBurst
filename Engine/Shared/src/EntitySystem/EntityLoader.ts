import { decode } from "@msgpack/msgpack";
import { EntitySystem } from "./EntitySystem";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { Component } from "./Component";
import { registeredTypes } from "./TypeRegister";
import { EntitySavedTypings, GetDefaultComponent, GetTypingsCompIndex, LoadCustomSaveData, TwoPropertiesAreIdentical } from "../Utils/SaveableDataUtils";

export class EntityTemplate {
    typings:EntitySavedTypings;
    entityData:{ [ent:number]: any } = {};

    DoesEntityExist(ent:number) : boolean {
        return this.entityData[ent] !== undefined;
    }

    DoesEntityHaveComponentByName(ent:number,compName:string) {
        if(!this.DoesEntityExist(ent)) {
            return false;
        }
        const compData = this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
        return compData !== undefined;
    }

    GetEntityComponent<T extends Component>(ent:number,type: { new(): T },newEnt:EntityData, mapping:EntityLoadMapping): T | undefined {
        if(!this.DoesEntityExist(ent)) {
            console.warn("No entity for template: " + ent);
            return undefined;
        }
        const compName = type.name;
        return this.GetEntityComponentByName(ent,compName,newEnt,mapping);
    }

    GetEntityComponentByName(ent:number,compName: string,newEnt:EntityData, mapping:EntityLoadMapping) {
        const compIndex  = GetTypingsCompIndex(compName,this.typings,false);
        if(compIndex === undefined) {
            return undefined;
        }
        if(this.entityData[ent] === undefined) {
            return undefined;
        }
        const compData = this.entityData[ent][compIndex];
        if(compData === undefined){
            return undefined;
        }
        const type = registeredTypes[compName];
        if(type === undefined) {
            console.warn("No component type for " + compName)
            return undefined;
        }
        const newCompType = type.type as any;
        const ret = new newCompType();
        this.LoadDataIntoComponent(ent,compName,mapping,ret); 
        return ret;
    }

    /** Given a component - load the data we have into that component */
    LoadDataIntoComponent(ent:number,compName:string,mapping:EntityLoadMapping,comp:Component,bPreserveNonDefaults = false) {
        if(mapping === undefined || mapping === null) {
            mapping = {};
        }
        const compIndex = GetTypingsCompIndex(compName,this.typings);
        const compData = this.entityData[ent][compIndex];
        if(!compData){
            return;
        }

        const defaultComp = bPreserveNonDefaults ? GetDefaultComponent(registeredTypes[compName].type,mapping[ent]) : undefined;
        
        const params = Object.keys(compData);
        for(var i = 0; i < params.length;i++) {
            const paramIndex = parseInt(params[i]);
            const paramName = this.typings[compIndex].compParams[paramIndex];

            if(bPreserveNonDefaults && !TwoPropertiesAreIdentical(defaultComp[paramName],comp[paramName])) {
                continue;
            }

            const data = LoadCustomSaveData(mapping[ent],mapping,compData[paramIndex],compName,paramName,this.typings);
            comp[paramName] = data;
        }
    }

    GetRawComponentData(ent:number,compName:string) : any {
        if(!this.DoesEntityExist(ent)) {
            return undefined;
        }
        const index = GetTypingsCompIndex(compName,this.typings,false);
        if(index === undefined) {
            return undefined;
        }
        return this.entityData[ent][index];
    }
}

export class EntityLoader {
    static GetEntityTemplateFromMsgpack(data:number[] | Uint8Array) : EntityTemplate {
        const template = new EntityTemplate();
        const decodedItem = decode(data);
        template.typings = decodedItem["T"];
        template.entityData = decodedItem["C"];
        return template;
    }

    static LoadTemplateIntoNewEntities(template:EntityTemplate,system:EntitySystem):EntityLoadMapping {
        if(!isValidTemplate(template)) {
            return;
        }
        const allEnts = Object.keys(template.entityData);
        const entMappings:EntityLoadMapping = {};
        allEnts.forEach(e=>{
            const newEnt = system.AddEntity();
            entMappings[e] = newEnt;
        });
        this.LoadTemplateIntoSpecifiedEntities(template,system,entMappings);
        return entMappings;
    }

    static LoadTemplateIntoExistingEntities(template:EntityTemplate,system:EntitySystem):EntityLoadMapping {
        if(!isValidTemplate(template)) {
            return;
        }
        const allEnts = Object.keys(template.entityData);
        const entMappings:EntityLoadMapping = {};
        allEnts.forEach(e=>{
            const newEnt = system.EnsureEntity(parseInt(e));
            entMappings[e] = newEnt;
        });
        this.LoadTemplateIntoSpecifiedEntities(template,system,entMappings);
        return entMappings;
    }

    static LoadTemplateIntoSpecifiedEntities(template:EntityTemplate,system:EntitySystem, entMappings:EntityLoadMapping, bPreserveNonDefaults = false):EntityLoadMapping {
        if(!isValidTemplate(template)) {
            return;
        }
        const allEnts = Object.keys(template.entityData);
        allEnts.forEach(e=>{
            if(entMappings[e] === undefined) {
                console.error("No mapping for entity in load: " + e);
                return;
            }
            const originalEntId = parseInt(e);
            const comps = Object.keys(template.entityData[originalEntId]);
            const entMapping = entMappings[e];
            //Load prefab first in case we are using defaults
            TryLoadComponentIn("Prefab",originalEntId,entMapping);
            for(var c = 0; c < comps.length;c++){
                const compKey = parseInt(Object.keys(template.typings)[parseInt(comps[c])]);
                const compName:string = template.typings[compKey].compName;
                if(compName === "Prefab") {
                    continue;
                }
                TryLoadComponentIn(compName,originalEntId,entMapping);
            }
        })
        return entMappings;

        function TryLoadComponentIn(compName:string,originalEntId:number,entMapping:EntityData) {
            if(!template.DoesEntityHaveComponentByName(originalEntId,compName)) {
                return;
            }
            const compType = registeredTypes[compName];
            if(!compType) {
                console.error("No registered comp type for: " + compName);
                return;
            }
            const existingComp = entMapping.GetComponentByName(compName);
            if(existingComp !== undefined) {
                template.LoadDataIntoComponent(originalEntId,compName,entMappings,existingComp, bPreserveNonDefaults);
            } else {
                const compData = template.GetEntityComponent(originalEntId,compType.type as any,entMapping,entMappings);
                if(compData !== undefined) {
                    system.AddSetComponentToEntity(entMapping,compData);
                }
            }
        }
    }
}

function isValidTemplate(template:EntityTemplate) {
    if(template === undefined || template === null || template.entityData === undefined || template.entityData === null || template.typings === undefined || template.typings === null) {
        return false;
    }
    return true;
}