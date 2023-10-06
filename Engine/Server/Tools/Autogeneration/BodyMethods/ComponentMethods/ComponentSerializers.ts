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
        structMethods += `\t${comp}* comparisonComp = new ${comp}();\n`;
        structMethods += `\tbool externalComparison = false;\n`
        structMethods += `\tif(childComponent != nullptr) {\n`;
        structMethods += `\t\texternalComparison = true;\n`
        structMethods += `\t\tdelete (comparisonComp);\n`;
        structMethods += `\t\tcomparisonComp = dynamic_cast<${comp}*>(childComponent);\n`;
        structMethods += `\t}\n`;
        structMethods += `//Each networked parameter\n`;
        compData.properties.forEach((param) => {
            if(!param.isCPROPERTY) {
                return;
            }
            structMethods = GeneratePropertySaveNetwork(structMethods, param);
        })
        structMethods += `//Default component cleanup\n`;
        structMethods += `\tif(externalComparison) {\n`;
        structMethods += `\t\tdelete (comparisonComp);\n`;
        structMethods += `\t}\n`;
        structMethods += `} \n`;

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
    var packingMethod = GetCorrectParamSaver();
    //If the same variable as comparison comp then we don't need to send as will be auto added!
    structMethods += `\tif (p.Include("${param.name}",${serializeType}, ignoreDefaultValues && comparisonComp->${param.name} == ${param.name})) {\n`;
    structMethods += `\t\t${packingMethod}\n`;
    structMethods += `\t}\n`;

    return structMethods;

    //For the specific data type - eg custom serialized or list etc
    function GetCorrectParamSaver() {
        var packingMethod = `p.packer->pack(${param.name});`;
        serializableClasses.forEach((serializeClassType) => {
            if (param.type.includes(serializeClassType.name)) {
                // Match against known container types
                const containerMatch = param.type.match(/^(std::map|std::unordered_map|std::set|std::unordered_set|std::vector|std::list)<(.+)>$/);
                if (containerMatch) {
                    // The type is in a container
                    const containerType = containerMatch[1];
                    const valueType = containerMatch[2];

                    if (containerType === "std::vector" || containerType === "std::list") {
                        packingMethod = `p.packer->pack_array(${param.name}.size());\n`;
                        packingMethod += `\t\tfor (auto& item : ${param.name}) {\n`;
                        packingMethod += `\t\t\t${serializeClassType.name}::PackSerializeData(p,item);\n`;
                        packingMethod += `\t\t}`;
                    } else {
                        console.log("Unknown container type for serialization " + containerType);
                        //@ts-ignore
                        process.exit(1);
                    }
                } else {
                    // The type is not in a container
                    packingMethod = serializeClassType.name + `::PackSerializeData(p,${param.name});`;
                }
            }
        });
        return packingMethod;
    }
}

function GeneratePropertyLoadNetwork(structMethods: string, param: ComponentProperty, bIfNotDefault:boolean) {
    //If not saved or networked then don't bother!
    if(!param.tags.includes(CompPropTags.NET) && !param.tags.includes(CompPropTags.SAVE)) {
        return structMethods;
    }

    //Find correct load method!
    var loadingMethod = GetCorrectParamLoader();
    
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

    function GetCorrectParamLoader() {
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
}
