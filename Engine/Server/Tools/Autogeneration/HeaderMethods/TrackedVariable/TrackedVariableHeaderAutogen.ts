import { FileStructs, StructHasCproperty } from "../../Utils/ComponentPropertyReader";



export function GetTrackedVariablesHSetup() : string {
    var ret = "";
    const compNames = Object.keys(FileStructs);

    if(compNames.length === 0) {
        return "";
    }

    //Next generate specialisations
    compNames.forEach(comp=>{
        const compData = FileStructs[comp];
        if(compData.isComponent) {
            return;
        }
        if(compData.properties.length === 0 || !StructHasCproperty(compData)) {
            return;
        }

        ret += `template <>\n`;
        ret += `class TrackedVariable<${comp}> : public ${comp} {\n`;

        ret += `public:\n`;
        //Set callbacks in tracked variable
        ret += `\tvoid setCallback(std::function<void()> cb) { \n`;
            compData.properties.forEach(property=>{
                if(property.isCPROPERTY) {
                    ret += `\t\t${property.name}.setCallback(cb);\n`;
                }
            })
        ret += `\t}\n`;

        //Insert overloaded equals to convert from normal object
        ret += `\tTrackedVariable<${comp}>& operator=(const ${comp}& item) {\n`;
            compData.properties.forEach(property=>{
                ret += `\t\t${property.name} = item.${property.name};\n`;
            })
            ret += `\t\treturn *this;\n`;
        ret += `\t}\n`;

        ret += `};\n`;

    })

    return ret;
}