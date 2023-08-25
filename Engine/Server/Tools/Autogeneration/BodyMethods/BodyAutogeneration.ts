import { GenerateCustomSerializationMethods, PerformSerializerPrepass } from "./ComponentMethods/ComponentSerializers";
import { CreateAutogenFile } from "../Autogenerator"
//@ts-ignore
import * as fs from 'fs';
import { FileComponentsProperties } from "../Utils/ComponentPropertyReader";
import { WriteFileIfChanged } from "../Utils/InvalidFileRemover";
import { RemovePlatformSpecificIncludePath } from "../Utils/PlatformUtils";

//This file deals with any autogeneration that is body specific

//Any prepass, like getting custom serializers
export function RunBodyPrepass() {
    PerformSerializerPrepass();
}

function createCppAutogenBase(relativeDir: string, fileNameExten: string, outputFile: string) : string {
    //Generate output
    let output = `// Autogenerated file from the 'Autogenerator.ts' tool prepass\n`;
    output += `#include "${relativeDir}/${fileNameExten}"\n`;
    return output;
}

//Run the autogeneration for a cpp body based on the file we are currently running
export function RunBodyAutogeneration(fileCode:any,filePath:string) {
    if(Object.keys(FileComponentsProperties).length == 0){
        return;
    }
    //Create the autogen file
    let { relativeDir, fileNameExten, outputFile } = CreateAutogenFile(filePath);

    //Common, Server specific etc are a given, so remove them
    relativeDir = RemovePlatformSpecificIncludePath(relativeDir);

    //Populate content
    let output = createCppAutogenBase(relativeDir, fileNameExten, outputFile);
    output += GenerateCustomSerializationMethods();

    //Write output
    WriteFileIfChanged(outputFile,output);
}