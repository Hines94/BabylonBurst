#pragma once
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>
#include <optional>
#include "Engine/Rendering/ExtractedMeshData.hpp"

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

   std::optional<ExtractedModelData> GetMeshFromFile(std::string filePath, std::string meshName, int fileIndex);

private:
    // Private constructor so that no objects can be created
    ModelLoader() {}

    static std::mutex dataMutex;
};