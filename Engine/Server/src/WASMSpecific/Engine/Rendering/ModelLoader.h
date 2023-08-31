#pragma once
#include "Engine/Rendering/ExtractedMeshData.hpp"
#include <map>
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

    void SetGetMeshCallback(std::function<std::vector<uint8_t>(std::string, std::string, int)> callback) {
        GetMeshCallback = callback;
    }

private:
    // Private constructor so that no objects can be created
    ModelLoader() {}

    std::function<std::vector<uint8_t>(std::string, std::string, int)> GetMeshCallback;

    std::map<std::string, ExtractedModelData> extractedModels;

    static std::mutex dataMutex;
};