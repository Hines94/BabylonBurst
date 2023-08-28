//@ts-ignore
import * as fs from 'fs';
import {RecursiveDirectoryProcess, buildPath} from "../Autogenerator"

const validFiles = new Set<string>();

export function AddValidFile(filePath:string) {
    validFiles.add(filePath);
}

function removeInvalidFile(filePath:string) {
    if(validFiles.has(filePath)){
        return;
    }
    fs.unlinkSync(filePath);
}

export function RemoveInvalidFiles() {
    RecursiveDirectoryProcess(buildPath,buildPath,removeInvalidFile);
}

export function WriteFile(outputFile:string, output:string) {
    fs.writeFileSync(outputFile, output);
    AddValidFile(outputFile);
}

export function DeleteFile(outputFile:string) {
    fs.unlinkSync(outputFile);
}

/** File includes a string? */
export function FileIncludesString(outputFile:string, check:string){
    if(fs.existsSync(outputFile)){
        return fs.readFileSync(outputFile, 'utf-8').includes(check);
    }
    return false;
}

export function WriteFileIfChanged(outputFile:string, output:string) : boolean {
    if(fs.existsSync(outputFile)){
        if(fs.readFileSync(outputFile, 'utf-8') !== output){
            fs.writeFileSync(outputFile, output);
        } else {
            return false;
        }
    } else { 
        fs.writeFileSync(outputFile, output); 
    }
    AddValidFile(outputFile);
    return true;
}