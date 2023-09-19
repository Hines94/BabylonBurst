#include "ModelLoader.h"
#include "Engine/Aws/AwsManager.h"
#include "Engine/Rendering/ExtractedMeshSerializer.h"
#include <iostream>
#include <msgpack.hpp>

ExtractedModelData* ModelLoader::GetMeshFromFile(const ModelSpecifier& ms) {
    return GetMeshFromFile(ms.FilePath, ms.MeshName, ms.FileIndex);
}
//Unfortunatly needed as Draco extractor not available for WASM (so need seperate method that uses BabylonJs to get mesh)
ExtractedModelData* ModelLoader::GetMeshFromFile(std::string filePath, std::string meshName, int fileIndex) {

    const auto name = filePath + "_" + std::to_string(fileIndex) + "_" + meshName;
    if (extractedModels.find(name) != extractedModels.end()) {
        return &extractedModels.find(name)->second;
    }

    if (!GetMeshCallback) {
        return nullptr;
    }

    const auto data = GetMeshCallback(filePath, meshName, fileIndex);

    if (data.empty()) {
        return nullptr;
    }

    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(data.data()), data.size());

    extractedModels.insert({name, ExtractedMeshSerializer::GetDataFromMsgpackData(oh)});

    return &extractedModels.find(name)->second;
}
