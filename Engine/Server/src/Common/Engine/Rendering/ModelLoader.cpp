#define TINYGLTF_IMPLEMENTATION
#define STB_IMAGE_IMPLEMENTATION
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "ModelLoader.h"
#include "Engine/Aws/AwsManager.h"
#include <iostream>

std::optional<tinygltf::Model> ModelLoader::GetModelFromFile(std::string filePath, int fileIndex) {

    const auto path = filePath + "_" + std::to_string(fileIndex);

    //Already loaded?
    const auto modelIt = loadedModels.find(path);
    if(modelIt != loadedModels.end()) {
        return modelIt->second;
    }
    
    //First - get the file with the data
    if (cachedModelData.find(path) == cachedModelData.end()) {
        AwsManager::getInstance().GetFileFromS3(filePath, fileIndex,
                                                [path, this](std::vector<uint8_t> vec) {
                                                    cachedModelData[path] = vec;
                                                });
        cachedModelData.insert(std::pair(path, std::vector<uint8_t>()));
        return std::nullopt;
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
    std::cout << "File data: " << data <<std::endl;
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
    return model;
}
