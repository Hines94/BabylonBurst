#include "ModelLoader.h"
#include "Engine/Aws/AwsManager.h"
#include "Engine/Rendering/ExtractedMeshSerializer.h"
#include <iostream>
#include <msgpack.hpp>

ExtractedModelData* ModelLoader::GetMeshFromFile(const ModelSpecifier& ms) {
    return GetMeshFromFile(ms.FilePath, ms.MeshName, ms.FileName);
}
//Unfortunatly needed as Draco extractor not available for WASM (so need seperate method that uses BabylonJs to get mesh)
ExtractedModelData* ModelLoader::GetMeshFromFile(std::string filePath, std::string fileName, std::string meshName) {

    const auto name = filePath + "_" + fileName + "_" + meshName;
    if (extractedModels.find(name) != extractedModels.end()) {
        return &extractedModels.find(name)->second;
    }

    if (!GetMeshCallback) {
        return nullptr;
    }

    const auto data = GetMeshCallback(filePath, fileName, meshName);

    if (data.empty()) {
        return nullptr;
    }

    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(data.data()), data.size());

    extractedModels.insert({name, ExtractedMeshSerializer::GetDataFromMsgpackData(oh)});

    return &extractedModels.find(name)->second;
}
