//@ts-ignore
import * as fs from 'fs';

//This file deals with serialization/deserialization of our components

import { CompPropTags, ComponentProperty, FileStructs, StructDetails } from "../../Utils/ComponentPropertyReader";
import { RecursiveDirectoryProcess, sourcePath, userSourcePath } from "../../Autogenerator";
import { UpdateStructsProperties, AllOtherStructs } from "../../Utils/ComponentPropertyReader"

const serializableClasses = new Array<StructDetails>();

function AddSerializablesFromFile(basePath:string,path:string) {
    let code = fs.readFileSync(path, 'utf-8');
    UpdateStructsProperties(code,basePath,path);

    const otherStruct = Object.keys(AllOtherStructs);
    otherStruct.forEach((struct) => {
        const data = AllOtherStructs[struct];
        if(data.inheritClasses.includes("ICustomMsgpack")) {
            serializableClasses.push(data);
            //check body has method
            if(!data.body.text.includes("LoadFromSerializeData")){
                console.error(`Struct ${data.name} has ICustomMsgpack but no LoadFromSerializeData method!`);
                //@ts-ignore
                process.exit(1);
            }
            if(!data.body.text.includes("PackSerializeData")){
                console.error(`Struct ${data.name} has ICustomMsgpack but no PackSerializeData method!`);
                //@ts-ignore
                process.exit(1);
            }
        }
    });
}
//TODO: This is unneccessary prepass? We can just process all files after main pass?
export function PerformSerializerPrepass() {
    RecursiveDirectoryProcess(sourcePath,sourcePath,AddSerializablesFromFile,[".h",".hpp"]);
    RecursiveDirectoryProcess(userSourcePath,userSourcePath,AddSerializablesFromFile,[".h",".hpp"]);
}

export function GenerateCustomSerializationMethods() : string {
    const compNames = Object.keys(FileStructs);
    let structMethods = "";
    compNames.forEach((comp) => {
        const compData = FileStructs[comp];
        if(!compData.isComponent) {
            return;
        }

        //Create Save serialization method
        structMethods += `\nvoid ${comp}::GetComponentData(PackerDetails& p, bool ignoreDefaultValues, Component* childComponent) { \n`;
        structMethods += `//Default component to test against for changed params\n`;
        structMethods += `\t${comp}* comparisonComp = dynamic_cast<${comp}*>(ComponentLoader::GetDefaultComponent("${comp}"));\n`;
        structMethods += `\tif(childComponent != nullptr) {\n`;
        structMethods += `\t\tcomparisonComp = dynamic_cast<${comp}*>(childComponent);\n`;
        structMethods += `\t}\n`;
        structMethods += `//Each networked parameter\n`;
        structMethods += `\tconst auto& packer = p.packer;\n`
        compData.properties.forEach((param) => {
            if(!param.isCPROPERTY) {
                return;
            }
            structMethods = GeneratePropertySaveNetwork(structMethods, param);
        })
        structMethods += `}\n`;

        //Create Load
        structMethods += `\nvoid ${comp}::LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) { \n`;
        compData.properties.forEach((param) => {
            if(!param.isCPROPERTY) {
                return;
            }
            structMethods = GeneratePropertyLoadNetwork(structMethods, param, false);
        })
        structMethods += `} \n`;

        //Create load if default
        structMethods += `\nvoid ${comp}::LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) { \n`;
        structMethods += `\tconst auto defaultItem = new ${comp}; \n`;
        compData.properties.forEach((param) => {
            if(!param.isCPROPERTY) {
                return;
            }
            structMethods = GeneratePropertyLoadNetwork(structMethods, param,true);
        })
        structMethods += `\tdelete(defaultItem);\n`;
        structMethods += `}\n`;
    })

    return structMethods;
}

function GetSerializationType(param:ComponentProperty) :string {
    var serializeType:string = "";
    if(param.tags.includes(CompPropTags.SAVE) && param.tags.includes(CompPropTags.NET)) {
        serializeType = "PackType::SaveAndNetwork"
    } else if (param.tags.includes(CompPropTags.SAVE)) {
        serializeType = "PackType::SaveOnly"
    } else if (param.tags.includes(CompPropTags.NET)) {
        serializeType = "PackType::NetworkOnly"
    }
    return serializeType;
}

//For this particular property generate a way to pack our data for saving or networking
function GeneratePropertySaveNetwork(structMethods: string, param: ComponentProperty) {
    //No serialization?
    const serializeType = GetSerializationType(param);
    if(serializeType === ""){
        return structMethods;
    }

    //Find correct save method!
    var packingMethod = CreatePackedParameter(param);
    //If the same variable as comparison comp then we don't need to send as will be auto added!
    structMethods += `\tif (p.Include("${param.name}",${serializeType}, ignoreDefaultValues && comparisonComp->${param.name} == ${param.name})) {\n`;
    structMethods += `\t\t${packingMethod}\n`;
    structMethods += `\t}\n`;

    return structMethods;

}
/** Generate a packing method for the parameter - be it list or custom etc */
export function CreatePackedParameter(param: ComponentProperty) {
    var packingMethod = `packer->pack(${param.name});`;
    serializableClasses.forEach((serializeClassType) => {
        if (param.type.includes(serializeClassType.name)) {
            // Match against known container types
            const containerMatch = param.type.match(/^(std::map|std::unordered_map|std::set|std::unordered_set|std::vector|std::list)<(.+)>$/);
            if (containerMatch) {
                // The type is in a container
                const containerType = containerMatch[1];
                const valueType = containerMatch[2];

                if (containerType === "std::vector" || containerType === "std::list") {
                    packingMethod = `packer->pack_array(${param.name}.size());\n`;
                    packingMethod += `\t\tfor (auto& item : ${param.name}) {\n`;
                    packingMethod += `\t\t\t${serializeClassType.name}::PackSerializeData(packer,item);\n`;
                    packingMethod += `\t\t}`;
                } else {
                    console.log("Unknown container type for serialization " + containerType);
                    //@ts-ignore
                    process.exit(1);
                }
            } else {
                // The type is not in a container
                packingMethod = serializeClassType.name + `::PackSerializeData(packer,${param.name});`;
            }
        }
    });
    return packingMethod;
}

function GeneratePropertyLoadNetwork(structMethods: string, param: ComponentProperty, bIfNotDefault:boolean) {
    //If not saved or networked then don't bother!
    if(!param.tags.includes(CompPropTags.NET) && !param.tags.includes(CompPropTags.SAVE)) {
        return structMethods;
    }

    //Find correct load method!
    var loadingMethod =  CreateParamLoader(param);
    
    //Create set code
    if(bIfNotDefault) {
        structMethods += `\tif (${param.name} == defaultItem->${param.name}) {\n`;
        structMethods += `\t\tif (auto data = GetCompData("${param.name}", compData)) {\n`;
        structMethods += `\t\t\t${loadingMethod}\n`;
        structMethods += `\t\t}\n`;    
        structMethods += `\t}\n`;    
    } else {
        structMethods += `\tif (auto data = GetCompData("${param.name}", compData)) {\n`;
        structMethods += `\t\t${loadingMethod}\n`;
        structMethods += `\t}\n`;    
    }

    return structMethods;
}

/** Create correct loader depending on the type of the parameter */
export function CreateParamLoader(param: ComponentProperty) {
    var loadingMethod = `${param.name} = data->as<${param.type}>();`;

    serializableClasses.forEach((serializeClassType) => {
        if (param.type.includes(serializeClassType.name)) {
            // Match against known container types
            const containerMatch = param.type.match(/^(std::map|std::unordered_map|std::set|std::unordered_set|std::vector|std::list)<(.+)>$/);
            if (containerMatch) {
                // The type is in a container
                const containerType = containerMatch[1];
                const valueType = containerMatch[2];

                if (containerType === "std::vector"  || containerType === "std::list") {
                    loadingMethod = `auto arr = data->as<std::vector<msgpack::object>>();\n`;
                    loadingMethod += `\t\tfor (const auto& element : arr) {\n`;
                    loadingMethod += `\t\t\t${serializeClassType.name}* item = ${serializeClassType.name}::LoadFromSerializeData(OldNewEntMap,&element);\n`;
                    loadingMethod += `\t\t\t${param.name}.push_back(item);\n`;
                    loadingMethod += `\t\t}`;
                } else {
                    console.log("Unknown container type for serialization " + containerType);
                    //@ts-ignore
                    process.exit(1);
                }
            } else {
                // The type is not in a container
                loadingMethod =  `${param.name} = ${serializeClassType.name}::LoadFromSerializeData(OldNewEntMap,data);`;
            }
        }
    });
    return loadingMethod;
}