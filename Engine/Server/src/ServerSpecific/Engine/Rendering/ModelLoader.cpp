#define TINYGLTF_IMPLEMENTATION
#define STB_IMAGE_IMPLEMENTATION
#define STB_IMAGE_WRITE_IMPLEMENTATION
#define TINYGLTF_ENABLE_DRACO
#include "ModelLoader.h"
#include "Engine/Aws/AwsManager.h"
#include <iostream>

std::optional<ExtractedModelData> ModelLoader::GetMeshFromFile(std::string filePath, std::string meshName, int fileIndex) {

    const auto path = filePath + "_" + std::to_string(fileIndex);

    //Already loaded?
    const auto modelIt = loadedModels.find(path);
    if(modelIt != loadedModels.end()) {
        return getMeshDataFromModel(path,meshName);
    }
    
    //First - get the file with the data
    if (cachedModelData.find(path) == cachedModelData.end()) {
        cachedModelData.insert(std::pair(path, std::vector<uint8_t>()));
        AwsManager::getInstance().GetFileFromS3(filePath, fileIndex,
                                                [path, this](std::vector<uint8_t> vec) {
                                                    cachedModelData[path] = vec;
                                                });
    }
    const auto cachedData = cachedModelData.find(path)->second;

    //Not ready yet? (async)
    if (cachedData.size() == 0) {
        return std::nullopt;
    }

    tinygltf::Model model;
    tinygltf::TinyGLTF loader;
    std::string err;
    std::string warn;
    auto data = reinterpret_cast<const char*>(cachedData.data());
    bool ret = loader.LoadASCIIFromString(&model, &err, &warn, data, cachedData.size(), "./");

    if (!warn.empty()) {
        printf("Model Loading Warn: %s\n", warn.c_str());
    }
    if (!err.empty()) {
        printf("Model Loading Error: %s\n", err.c_str());
    }
    if (!ret) {
        std::cout << "Failed to load model data in for " << path << std::endl;
        return std::nullopt;
    }
    loadedModels.insert(std::pair(path,model));
    return getMeshDataFromModel(path,meshName);
}


std::optional<ExtractedModelData> ModelLoader::getMeshDataFromModel(std::string modelName, std::string meshName) {
    const auto modelIt = loadedModels.find(modelName);
    if(modelIt == loadedModels.end()) {
        return std::nullopt;
    }
    const auto& model = modelIt->second;
    for(const auto& node : model.nodes) {
        if(node.mesh == 0) {
            continue;
        }
        const auto& mesh = model.meshes[node.mesh];
        if(mesh.name != meshName) { 
            continue; 
        }
        ExtractedModelData result;
        for (size_t i = 0; i < mesh.primitives.size(); i++) {
            const tinygltf::Primitive& primitive = mesh.primitives[i];

            // Extract indices
            const tinygltf::Accessor& accessor = model.accessors[primitive.indices];
            const tinygltf::BufferView& bufferView = model.bufferViews[accessor.bufferView];
            const tinygltf::Buffer& buffer = model.buffers[bufferView.buffer];
            const uint32_t* indices = reinterpret_cast<const uint32_t*>(buffer.data.data() + bufferView.byteOffset + accessor.byteOffset);

            // Extract vertex positions
            const tinygltf::Accessor& vertexAccessor = model.accessors[primitive.attributes.find("POSITION")->second];
            const tinygltf::BufferView& vertexBufferView = model.bufferViews[vertexAccessor.bufferView];
            const tinygltf::Buffer& vertexBuffer = model.buffers[vertexBufferView.buffer];
            const float* vertices = reinterpret_cast<const float*>(vertexBuffer.data.data() + vertexBufferView.byteOffset + vertexAccessor.byteOffset);

            // Assuming 3 components per vertex (i.e., x, y, z)
            for (size_t v = 0; v < vertexAccessor.count; v++) {
                result.vertices.push_back({vertices[v * 3], vertices[v * 3 + 1], vertices[v * 3 + 2]});
            }

            // Assuming the primitive mode is TRIANGLES (i.e., 3 indices per triangle)
            for (size_t t = 0; t < accessor.count; t += 3) {
                result.triangles.push_back({indices[t], indices[t + 1], indices[t + 2]});
            }

            return result;
        }
    }

    std::cerr << "No mesh data for " << modelName << meshName << std::endl;

    return std::nullopt;
}