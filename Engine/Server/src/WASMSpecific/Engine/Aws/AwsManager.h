#pragma once

#include <functional>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

class AwsManager {
public:
    AwsManager();

    static AwsManager& getInstance() {
        static AwsManager instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    AwsManager(AwsManager const&) = delete;
    void operator=(AwsManager const&) = delete;

    //Get raw bytes from S3
    void GetFileFromS3(const std::string& key, std::string fileName, std::function<void(std::vector<uint8_t>)> readyCallback);
    void GetAllObjectsInS3(std::function<void(std::vector<std::string>)> readyCallback);

    //Set from WASM sepecific (as this is our 'core' library and we don't have access to Emscripten)
    void SetGetFileCallback(std::function<void(std::string, std::string, std::function<void(std::vector<uint8_t>)>)> callback) {
        getFileCallback = callback;
    }

    void SetGetAllObjectsCallback(std::function<void(std::function<void(std::vector<std::string>)>)> callback) {
        getAllObjectsCallback = callback;
    }

private:
    std::function<void(std::string, std::string, std::function<void(std::vector<uint8_t>)>)> getFileCallback;
    std::function<void(std::function<void(std::vector<std::string>)>)> getAllObjectsCallback;
};