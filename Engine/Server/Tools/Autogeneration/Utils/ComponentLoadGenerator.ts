//@ts-ignore
import * as fs from 'fs';
import { buildPath, sourcePath } from "../Autogenerator";
import { AllComponents, FileComponentsProperties } from "./ComponentPropertyReader";
import { AddValidFile } from "./InvalidFileRemover";
import { RemovePlatformSpecificIncludePath } from './PlatformUtils';


export function GenerateComponentLoader() {
    var output = `// Autogenerated file from the 'Autogenerator.ts' tool prepass. Auto returns correct component via predefined comp regex from each file.\n`;
    output += `#include "Engine/SaveLoad/ComponentLoader.h"\n`;
    //Includes
    const comps = extractRelevantComponents();
    
    //Methods
    generateGetComponentFromName();
    generateGetNameFromComponent();
    generateGetTypeFromName();

    //Finalise
    finaliseFile();

    function extractRelevantComponents() {
        const comps = Object.keys(AllComponents);
        comps.forEach(element => {
            output += `#include "${AllComponents[element].headerPath}"\n`;
        });
        output += `\n`;
        return comps;
    }

    function generateGetComponentFromName() {
        output += "Component* ComponentLoader::GetComponentFromName(const std::string& Name) {\n";
        comps.forEach(element => {
            output += `\tif(Name == "${element}") { return new ${element}(); }\n`;
        });
        output += "\treturn nullptr;\n";
        output += "}\n";
    }

    function generateGetNameFromComponent() {
        output += "std::string ComponentLoader::GetNameFromComponent(Component* comp) {\n";
        comps.forEach(element => {
            output += `\tif(dynamic_cast<${element}*>(comp)) { return "${element}"; }\n`;
        });
        output += `\treturn "";\n`;
        output += `}\n`;
    }

    function generateGetTypeFromName() {
        output += `std::string ComponentLoader::GetComponentNameFromType(const std::type_index& Type) {\n`;
        comps.forEach(element => {
            output += `\tif(std::type_index(typeid(${element})) == Type) { return "${element}"; }\n`;
        });
        output += `\treturn "";\n`;
        output += `}\n`;
    }

    function finaliseFile() {
        const path = buildPath + "/ComponentLoader_autogenerated.cpp";
        if (fs.existsSync(path)) {
            if (fs.readFileSync(path, 'utf-8') !== output) {
                fs.writeFileSync(path, output);
            }
        } else { fs.writeFileSync(path, output); }

        AddValidFile(path);
    }
}