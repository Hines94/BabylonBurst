#include "ModelLoader.h"
#include "Engine/Aws/AwsManager.h"
#include <iostream>
#include <msgpack.hpp>
#include "Engine/Rendering/ExtractedMeshSerializer.h"

ExtractedModelData* ModelLoader::GetMeshFromFile(std::string filePath, std::string meshName, int fileIndex) {

    const auto name = filePath + "_" + std::to_string(fileIndex) + "_" + meshName;
    if(extractedModels.find(name) != extractedModels.end()) {
        return &extractedModels.find(name)->second;
    }

    if(!GetMeshCallback) {
        return nullptr;
    }

    const auto data = GetMeshCallback(filePath,meshName,fileIndex);

    if(data.empty()) {
        return nullptr;
    }

    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(data.data()), data.size());


    extractedModels.insert(std::pair(name,ExtractedMeshSerializer::GetDataFromMsgpackData(oh)));

    return &extractedModels.find(name)->second;
}
