import { FileStructs } from "../../Utils/ComponentPropertyReader";
import { CreatePackedParameter, CreateParamLoader } from "../ComponentMethods/ComponentSerializers";



export function GenerateMessageAutoSerialize() : string {

    var structMethods = "";

    const otherStruct = Object.keys(FileStructs);
    otherStruct.forEach((struct) => {
        const compData = FileStructs[struct];
        if(!compData.inheritClasses.includes("AutoSerializedMessage")) {
            return;
        }
        //First generate serialization
        structMethods += `\nstd::vector<uint8_t> ${struct}::AutoSerialize() { \n`;
        //Generate packer
        structMethods += `\tmsgpack::sbuffer sbuf;\n`;
        structMethods += `\tmsgpack::packer<msgpack::sbuffer>* packer = new msgpack::packer<msgpack::sbuffer>(&sbuf);\n`;
        //Start map pack
        structMethods += `\tpacker->pack_map(${compData.properties.length});\n`;
        //Pack each property
        compData.properties.forEach((param) => {
            structMethods += `\tpacker->pack("${param.name}");\n`;
            const packed = CreatePackedParameter(param);
            structMethods += `\t${packed}\n`;
        })
        structMethods += `\tdelete packer;\n`;
        structMethods += `\tstd::vector<uint8_t> packedData(sbuf.data(), sbuf.data() + sbuf.size());\n`;
        structMethods += `\treturn packedData;\n`;
        structMethods += `}\n`;

        //Next generate deserialization
        structMethods += `\n void ${struct}::AutoDeserialize(std::vector<uint8_t> data) { \n`
        structMethods += `\tstd::map<Entity, EntityData*>OldNewEntMap;\n`;//Create empty map to indicate use same id to entityData
        //Get data into handy map
        structMethods += `\tmsgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(data.data()), data.size());\n`;
        structMethods += `\tmsgpack::object obj = oh.get();\n`;
        structMethods += `\tstd::map<std::string, msgpack::object> compData;\n`;
        structMethods += `\ttry{ obj.convert(compData); }\n`;
        structMethods += `\tcatch(...) { std::cerr << "Error converting data for ${struct}" << std::endl; }\n`

        //Unload each param
        compData.properties.forEach((param) => {
            structMethods += `\tif (auto data = GetParamData("${param.name}", compData)) {\n`;
            const unpacked = CreateParamLoader(param);
            structMethods += `\t${unpacked}\n`;
            structMethods += `\t}\n`;
        })
        structMethods += `}\n`;
    });

    return structMethods;
}