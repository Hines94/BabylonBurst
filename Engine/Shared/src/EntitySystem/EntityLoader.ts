import { decode } from "@msgpack/msgpack";
import { EntitySavedTypings, GetTypingsCompIndex } from "./EntitySaver";
import { EntitySystem } from "./EntitySystem";
import { EntityData, EntityLoadMapping } from "./EntityData";
import { SaveableDataField } from "./SaveableDataField";
import { Component } from "./Component";
import { registeredTypes } from "./TypeRegister";

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
        const compNames = Object.keys(this.typings);
        if(!compNames.includes(compName)) {
            return false;
        }
        const compData = this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
        return compData !== undefined;
    }

    GetEntityComponent<T extends Component>(ent:number,type: { new(): T },newEnt:EntityData, mapping:EntityLoadMapping): T | undefined {
        if(!this.DoesEntityExist(ent)) {
            return undefined;
        }
        const compName = type.name;
        return this.GetEntityComponentByName(ent,compName,newEnt,mapping);
    }

    GetEntityComponentByName(ent:number,compName: string,newEnt:EntityData, mapping:EntityLoadMapping) {
        const compNames = Object.keys(this.typings);
        if(!compNames.includes(compName)) {
            return undefined;
        }
        const compData = this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
        if(!compData){
            return undefined;
        }
        const type = registeredTypes[compName];
        if(!type) {
            console.warn("No component type for " + compName)
            return undefined;
        }
        //@ts-ignore
        const ret = new type.type();
        this.LoadDataIntoComponent(ent,compName,mapping,ret); 
        return ret;
    }

    /** Given a component - load the data we have into that component */
    LoadDataIntoComponent(ent:number,compName:string,mapping:EntityLoadMapping,comp:Component) {
        const compData = this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
        if(!compData){
            return;
        }
        const params = Object.keys(compData);
        for(var i = 0; i < params.length;i++) {
            const paramIndex = parseInt(params[i]);
            const paramName = this.typings[compName][paramIndex];
            comp[paramName] = SaveableDataField.loadCustomSaveData(mapping[ent],mapping,compData[paramIndex],compName,paramName);
        }
    }

    GetRawComponentData(ent:number,compName:string) : any {
        if(!this.DoesEntityExist(ent)) {
            return undefined;
        }
        const compNames = Object.keys(this.typings);
        if(!compNames.includes(compName)) {
            return undefined;
        }
        return this.entityData[ent][GetTypingsCompIndex(compName,this.typings)];
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
        const allEnts = Object.keys(template.entityData);
        const entMappings:EntityLoadMapping = {};
        allEnts.forEach(e=>{
            const newEnt = system.EnsureEntity(parseInt(e));
            entMappings[e] = newEnt;
        });
        this.LoadTemplateIntoSpecifiedEntities(template,system,entMappings);
        return entMappings;
    }

    static LoadTemplateIntoSpecifiedEntities(template:EntityTemplate,system:EntitySystem, entMappings:EntityLoadMapping):EntityLoadMapping {
        const allEnts = Object.keys(template.entityData);
        allEnts.forEach(e=>{
            if(entMappings[e] === undefined) {
                console.error("No mapping for entity in load: " + e);
                return;
            }
            const originalEntId = parseInt(e);
            const comps = Object.keys(template.entityData[originalEntId]);
            for(var c = 0; c < comps.length;c++){
                const compName = Object.keys(template.typings)[parseInt(comps[c])];
                const compType = registeredTypes[compName];
                if(!compType) {
                    console.error("No registered comp type for: " + compName);
                    continue;
                }
                const existingComp = entMappings[e].GetComponentByName(compName);
                if(existingComp !== undefined) {
                    template.LoadDataIntoComponent(originalEntId,compName,entMappings,existingComp);
                } else {
                    const compData = template.GetEntityComponent(originalEntId,compType.type as any,entMappings[e],entMappings);
                    system.AddSetComponentToEntity(entMappings[e],compData);
                }
            }
        })
        return entMappings;
    }
}
