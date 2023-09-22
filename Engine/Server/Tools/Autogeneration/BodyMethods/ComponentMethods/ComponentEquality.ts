import { CompPropTags, FileStructs } from "../../Utils/ComponentPropertyReader";


export function GenerateEqualityChecks() : string {
    return GeneratePureEquals() + GenerateisEqual();
}

function GeneratePureEquals() {
    const compNames = Object.keys(FileStructs);
    var equalityOperators = "";
    compNames.forEach((comp) => {
        const compData = FileStructs[comp];
        if(!compData.isComponent) {
            return;
        }
        
        equalityOperators += `\nbool ${comp}::operator==(const ${comp}& other) const { \n`;
        compData.properties.forEach((param) => {
            if (!param.isCPROPERTY || !param.tags.includes(CompPropTags.SAVE) || param.tags.includes(CompPropTags.NOEQUALITY)) {
                return;
            }
            equalityOperators += `\tif(${param.name} != other.${param.name}) { return false; }\n`;
        });
        equalityOperators += `\treturn true;\n`;
        equalityOperators += `}\n`;
    });
    return equalityOperators;
}
function GenerateisEqual() {
    const compNames = Object.keys(FileStructs);
    var equalityOperators = "";
    compNames.forEach((comp) => {
        const compData = FileStructs[comp];
        if(!compData.isComponent) {
            return;
        }

        equalityOperators += `\nbool ${comp}::isEqual(const Component* other) const { \n`;
        equalityOperators += `\tconst ${comp}* d = dynamic_cast<const ${comp}*>(other);\n`
        equalityOperators += `\tif(!d) { return false; } \n`
        compData.properties.forEach((param) => {
            if (!param.isCPROPERTY || !param.tags.includes(CompPropTags.SAVE) || param.tags.includes(CompPropTags.NOEQUALITY)) {
                return;
            }
            equalityOperators += `\tif(${param.name} != d->${param.name}) { return false; }\n`;
        });
        equalityOperators += `\treturn true;\n`;
        equalityOperators += `}\n`;
    });
    return equalityOperators;
}
