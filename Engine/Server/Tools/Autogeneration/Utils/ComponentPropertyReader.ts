//@ts-ignore
import Parser = require('tree-sitter');
//@ts-ignore
import CPP = require('tree-sitter-cpp');
import { FindMacroComment } from './CommentMacroFinder';
import { EnvVarLoader } from './EnvironmentVariableLoader';
import { RemovePlatformSpecificIncludePath } from './PlatformUtils';

const parser = new Parser();
parser.setLanguage(CPP);


/** Different types of custom property specifiers that properties may have */
export enum CompPropTags {
    SAVE,
    NET,
    NOTYPINGS,
    EDREAD,
    NOEQUALITY
};

/** Different types of custom tag that componments themselves may have */
export enum CompTags {
    NOTYPINGS,
    NOSAVE,
    NONETWORK
}

function isValidComponentTag(value: string): boolean {
    return Object.keys(CompTags).some((key) => key === value);
}

function isValidCustomProperty(value: string): boolean {
    return Object.keys(CompPropTags).some((key) => key === value);
}

export type ComponentProperty = {
    name: string;
    type: string;
    tags: CompPropTags[];
    comment: string;
};

export interface StructDetails {
    name:string;
    headerPath:string;
    structTags:CompTags[];
    properties: ComponentProperty[];
    inheritClasses: string[];
    body:Parser.SyntaxNode;
    comment:Parser.SyntaxNode | null;
    macros:Parser.SyntaxNode[];
    isStruct:boolean
}

export function StructInheritsFromComponent(details:StructDetails) : boolean {
    if(details.inheritClasses.length > 0 && details.inheritClasses.includes("Component")){
        return true;
    }
    return false;
}

/** All structs and properties contained in the current file */
export var AllComponents:{ [component: string] : StructDetails } = {};
export var FileComponentsProperties:{ [component: string] : StructDetails } = {};
export var AllOtherStructs:{ [name: string] : StructDetails } = {};
export var AllEnums: { [name: string] : string[] } = {};

function isTypeNode(nodeType: string): boolean {
    return nodeType === 'primitive_type' || nodeType === 'type_identifier' || nodeType == 'pointer_declarator declarator' 
    || nodeType == 'storage_class_specifier'|| nodeType == 'qualified_identifier' || nodeType == 'storage_class_specifier';
}

function isNameNode(nodeType: string): boolean {
    return nodeType === 'field_identifier' || nodeType == 'pointer_declarator' || nodeType == '';
}

//Reads over a file and gets any components and custom property specifiers for our structs
export function UpdateStructsProperties(code:any,basePath:string,filePath:string)  {
    FileComponentsProperties = {};

    const tree = parser.parse(code);
    const structs = findStructs(tree.rootNode,0,basePath,filePath);

    //Add structs
    for(const struct of structs) {
        //Setup with struct Name
        const structName = struct.name;

        //Check if component inherits
        const inheritsFromComponent = StructInheritsFromComponent(struct);
        if(inheritsFromComponent && FileComponentsProperties[structName] === undefined){
            if(struct.isStruct === false){
                console.error(`Item '${struct.name}' found in header '${struct.headerPath}' is class. Please change to struct.`);
                //@ts-ignore
                process.exit(1);
            }
            FileComponentsProperties[structName] = struct;
            AllComponents[structName] = struct;
        }
        if(!inheritsFromComponent && AllOtherStructs[structName] === undefined){
            AllOtherStructs[structName] = struct;
        }

        //Add all properties
        AddStructParams(struct);
    }
    //Add enums
    const enums = findEnums(tree.rootNode);
}


function AddStructParams(structDetails:StructDetails) {
    if(structDetails.body === undefined || structDetails.body === null){
        return;
    }
    const properties = findPropertiesInStruct(structDetails.body, 'CPROPERTY');
    const inheritsFromComponent = StructInheritsFromComponent(structDetails);

    for (var i = 0; i < properties.length; i++) {
        const type = getChildNodeBool(properties[i].property, isTypeNode);
        const name = getChildNodeBool(properties[i].property, isNameNode);
        if (type.length > 0 && name.length > 0) {
            const tags: CompPropTags[] = [];
            //Get macro properties
            if (properties[i].macro !== null) {
                const tagRegex = /\(([^)]+)\)/;
                //@ts-ignore
                const inner = tagRegex.exec(properties[i].macro?.text);
                if(inner === null){
                    throw new Error("Invalid macro found in component property " + name[0].text);
                }
                inner[1].split(',').forEach((tag) => {
                    var rawTag = tag.trim();
                    if (isValidCustomProperty(rawTag) === false) {
                        console.error(`Invalid specifier for custom SFP '${rawTag}' found in component '${structDetails.name}' property '${name[0].text}'.`);
                        //@ts-ignore
                        process.exit(1);
                    }
                    else {
                        tags.push(CompPropTags[rawTag as keyof typeof CompPropTags]);
                    }
                });
            }
            const isPointer = name[0].text.includes("*");
            const propDetails: ComponentProperty = {
                name: isPointer? name[0].text.replace("*", "").replace(" ", "") : name[0].text.replace(" ", ""),
                type: isPointer? type[0].text + "*" : type[0].text,
                tags: tags,
                //@ts-ignore
                comment: properties[i].comment !== null ? properties[i].comment.text : ""
            };
            //Add property
            if (inheritsFromComponent) {
                structDetails.properties.push(propDetails);
            } else {
                structDetails.properties.push(propDetails);
            }
        }
    }
}

/** Main function to find any structs within our file that could be important */
function findStructs(node:Parser.SyntaxNode,childIndex:number,basePath:string,headerPath:string) : StructDetails[] {
    if(EnvVarLoader.getInstance().environmentVariables["NO_PHYSICS"] === 'true') {
        if(headerPath.includes("/Engine/Physics")) {
            return [];
        }
    }

    const ret:StructDetails[] = [];
    if (node.type === 'struct_specifier' || node.type === 'class_specifier') {
        const structNameNode = getChildNode(node, 'type_identifier');
        const structName = structNameNode[0].text;
        const structBody = getChildNode(node, 'field_declaration_list')[0];
        const cleanHeaderPath = RemovePlatformSpecificIncludePath(
            headerPath.replace(basePath + "/", "")
        );
        const details:StructDetails = {
            name: structName,
            headerPath:cleanHeaderPath,
            structTags:[],
            properties: [],
            inheritClasses: [],
            body: structBody,
            comment: null,
            macros: [],
            isStruct: node.type === 'struct_specifier'
        }
        //Add parent classes
        const inheritedComps = getChildNode(node, 'base_class_clause');
        inheritedComps.forEach((comp) => {
            const pattern = /:\s*public\s*/;
            const result = comp.text.replace(pattern, "");
            details.inheritClasses.push(result);
        });
        //Add comments/macro 
        //@ts-ignore
        const {macros,comment} = FindMacroComment(node.parent,childIndex,["CCOMPONENT",'REQUIRE_OTHER_COMPONENTS']);
        details.macros = macros;
        details.comment = comment;
        macros.forEach((macro) => {
            if(macro.text.includes("CCOMPONENT")){
                GetStructTags(details,macro.text);
            }
        });
        //Avoid forward declarations
        if(structBody){
            ret.push(details);   
        }
    }

    for (let i = 0; i < node.childCount; i++) {
        const found = node.child(i);
        if(found) {
            ret.push(...findStructs(found,i,basePath,headerPath));
        }
    }

    return ret;
}

function GetStructTags(structDetails:StructDetails,macroText:string) {
    const tags:CompTags[] = [];
    const tagRegex = /\(([^)]+)\)/;
    const inner = tagRegex.exec(macroText);
    if(inner === null){
        throw new Error("Invalid macro found in component property " + name[0].text);
    }
    inner[1].split(',').forEach((tag) => {
        var rawTag = tag.trim();
        if (isValidComponentTag(rawTag) === false) {
            console.error(`Invalid specifier for custom Struct '${rawTag}' found in component '${structDetails.name}'.`);
            //@ts-ignore
            process.exit(1);
        }
        else {
            tags.push(CompTags[rawTag as keyof typeof CompTags]);
        }
    });
    structDetails.structTags = tags;
}

function findEnums(node:Parser.SyntaxNode) : void {
    if (node.type === 'enum_specifier') {
        const enumNameNode = getChildNode(node, 'type_identifier');
        const enumName = enumNameNode[0].text;
        const enumBody = getChildNode(node, 'enumerator_list')[0];
        const enumValues = getChildNode(enumBody, 'enumerator');
        const values:string[] = [];
        enumValues.forEach((value) => {
            values.push(value.text);
        });
        AllEnums[enumName] = values;
    }

    for (let i = 0; i < node.childCount; i++) {
        const found = node.child(i);
        if(found) {
            findEnums(found);
        }
    }
}

function getChildNodeBool(node:Parser.SyntaxNode, callback: (type: string) => boolean) : Parser.SyntaxNode[] {
    let ret: Parser.SyntaxNode[] = [];

    node.children.forEach((childNode) => {
      if (callback(childNode.type)) {
        ret.push(childNode);
      }
    });
    
    return ret;
}

function getChildNode(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode[] {
    return getChildNodeBool(node, childType => childType === type);
}

function findPropertiesInStruct(node: Parser.SyntaxNode, macroName: string): { macro: Parser.SyntaxNode | null, property: Parser.SyntaxNode, comment: Parser.SyntaxNode | null }[] {
    let ret: { macro: Parser.SyntaxNode | null, property: Parser.SyntaxNode, comment: Parser.SyntaxNode | null  }[] = [];

    // Iterate through the children of the given node
    for (let i = 0; i < node.children.length; i++) {
        const childNode = node.children[i];

        // Check if the current childNode is a property
        if (childNode.type === 'field_declaration') {
            const {macros,comment} = FindMacroComment(node,i,[macroName])
            const macro = macros.length > 0 ? macros[0] : null;
            ret.push({ macro: macro, property: childNode,comment:comment });
        }
    }

    return ret;
}

