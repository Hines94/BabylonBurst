import { CompPropTags, FileComponentsProperties } from "../../Utils/ComponentPropertyReader";


export function GenerateTrackedSetup() : string {
    var ret = "";
    const compNames = Object.keys(FileComponentsProperties);
    compNames.forEach(comp=>{
        const compData = FileComponentsProperties[comp];
        //Create Save serialization method
        ret += `\nvoid ${comp}::SetupTrackedVariables(EntityData* Owner) { \n`;

        ret += `\tauto changeLambda = [Owner](){\n`;
        ret += `\t\tEntityComponentSystem::OnComponentChanged(Owner,typeid(${comp}));\n`;
        ret += `\t};\n`;

        compData.properties.forEach(property=>{
            ret += `\t${property.name}.setCallback(changeLambda);\n`;
        })

        ret += `}\n`;
    })

    return ret;
}
