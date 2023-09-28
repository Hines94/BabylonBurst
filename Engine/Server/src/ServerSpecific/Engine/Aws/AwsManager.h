#pragma once

#include <aws/s3/S3Client.h>
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

private:
    std::string bucketName;
    std::string regionName;
    Aws::S3::S3Client* s3Client;
};