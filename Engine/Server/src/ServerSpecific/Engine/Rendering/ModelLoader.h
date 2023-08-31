#pragma once
#include "Engine/Rendering/ExtractedMeshData.hpp"
#include "tiny_gltf.h"
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

class ModelLoader {
public:
    // Delete copy constructor and assignment operator
    ModelLoader(ModelLoader const&) = delete;
    void operator=(ModelLoader const&) = delete;

    // Access function for the unique Singleton instance
    static ModelLoader& getInstance() {
        // This is thread-safe in C++11 and later
        static ModelLoader instance;
        return instance;
    }

    ExtractedModelData* GetMeshFromFile(std::string filePath, std::string meshName, int fileIndex);

private:
    // Private constructor so that no objects can be created
    ModelLoader() {}

    static std::mutex dataMutex;

    std::unordered_map<std::string, std::vector<uint8_t>> cachedModelData;

    std::map<std::string, tinygltf::Model> loadedModels;

    std::map<std::string, ExtractedModelData> extractedModels;

    ExtractedModelData* getMeshDataFromModel(std::string modelName, std::string meshName);
};