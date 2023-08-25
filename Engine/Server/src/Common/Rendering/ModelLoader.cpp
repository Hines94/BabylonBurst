#include "ModelLoader.h"
#include "tiny_gltf.h"
#include "Aws/AwsManager.h"

void ModelLoader::GetModelFromFile(std::string filePath,int fileIndex) {

    const auto path = filePath.append(std::to_string(fileIndex));
    //First - get the file with the data
    if(cachedModelData.find(path) == cachedModelData.end()) {
        AwsManager::getInstance().GetFileFromS3(filePath,fileIndex,
                                                    [path, this](std::vector<uint8_t> vec) {
                                                        cachedModelData[path] = vec;
                                                    });
        cachedModelData.insert(std::pair(path,std::vector<uint8_t>()));
        return;
    }
    const auto cachedData = cachedModelData.find(path)->second;

    //Not ready yet? (async)
    if(cachedData.size() == 0) {
        return;
    } 
        
    tinygltf::Model model;
    tinygltf::TinyGLTF loader;
    std::string err;
    std::string warn;

    bool ret = loader.LoadASCIIFromFile(&model, &err, &warn, "path_to_your_model.gltf");

    if (!warn.empty()) {
        printf("Warn: %s\n", warn.c_str());
    }

    if (!err.empty()) {
        printf("Err: %s\n", err.c_str());
    }

    if (!ret) {
        printf("Failed to load .gltf\n");
        return;
    }
}
