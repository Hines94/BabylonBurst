import { CompPropTags, FileStructs } from "../../Utils/ComponentPropertyReader";


export function GenerateComponentTracking() : string {
    var ret = "";
    const compNames = Object.keys(FileStructs);
    compNames.forEach(comp=>{
        const compData = FileStructs[comp];
        if(!compData.isComponent) {
            return;
        }

        //Create Save serialization method
        ret += `\nvoid ${comp}::SetupTrackedVariables(EntityData* Owner) { \n`;

        ret += `\tauto changeLambda = [Owner](){\n`;
        ret += `\t\tEntityComponentSystem::OnComponentChanged(Owner,typeid(${comp}));\n`;
        ret += `\t};\n`;

        compData.properties.forEach(property=>{
            if(!property.isCPROPERTY) {
                return;
            }
            ret += `\t${property.name}.setCallback(changeLambda);\n`;
        })

        ret += `}\n`;
    })

    return ret;
}
