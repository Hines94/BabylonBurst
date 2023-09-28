#include "AwsManager.h"
#include "Engine/Utils/Environment.h"
#include "Engine/Utils/StringUtils.h"
#include "rapidcsv.h"
#include <aws/core/Aws.h>
#include <aws/core/auth/AWSCredentialsProviderChain.h>
#include <aws/core/utils/memory/stl/AWSStringStream.h>
#include <aws/s3/S3Client.h>
#include <aws/s3/model/GetObjectRequest.h>
#include <aws/s3/model/ListObjectsV2Request.h>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <vector>
#include <zip.h>

AwsManager::AwsManager() : bucketName{Environment::GetEnvironmentVariable("AWS_BUCKET_NAME")},
                           regionName{Environment::GetEnvironmentVariable("AWS_BUCKET_REGION")} {
    Aws::SDKOptions options;
    Aws::InitAPI(options);
    Aws::Client::ClientConfiguration config;
    config.region = this->regionName;

    // create a default credentials provider chain
    Aws::Auth::DefaultAWSCredentialsProviderChain providerChain;
    Aws::Auth::AWSCredentials credentials(Environment::GetEnvironmentVariable("AWS_ID"), Environment::GetEnvironmentVariable("AWS_KEY"));
    if (Environment::GetEnvironmentVariable("AWS_ID").empty() || Environment::GetEnvironmentVariable("AWS_KEY").empty()) {
        std::cerr << "AWS KEYS NOT SET! Please set AWS_ID and AWS_KEY in .env" << std::endl;
        std::exit(EXIT_FAILURE);
    }
    this->s3Client = new Aws::S3::S3Client(config);
    std::cout << "Aws Client setup" << std::endl;
}

void AwsManager::GetFileFromS3(const std::string& key, std::string fileName, std::function<void(std::vector<uint8_t>)> readyCallback) {
    Aws::S3::Model::GetObjectRequest object_request;
    object_request.WithBucket(bucketName.c_str()).WithKey(StringUtils::EnsureZipExtension(key).c_str());
    auto get_object_outcome = s3Client->GetObject(object_request);

    if (get_object_outcome.IsSuccess()) {
        auto& retrieved_file = get_object_outcome.GetResultWithOwnership().GetBody();

        // Read data from stream
        std::istreambuf_iterator<char> begin(retrieved_file), end;
        std::vector<uint8_t> buffer(begin, end);

        zip_error_t error;
        zip_source_t* src = zip_source_buffer_create(buffer.data(), buffer.size(), 0, &error);

        if (src == nullptr) {
            zip_error_fini(&error);
            std::cout << "Error unzipping S3 file: " << key << std::endl;
            // handle the error
            readyCallback(std::vector<uint8_t>());
        }

        // Open the zip archive from the source
        int flags = ZIP_CHECKCONS;
        zip_t* archive = zip_open_from_source(src, flags, &error);

        if (archive == nullptr) {
            zip_source_free(src);
            zip_error_fini(&error);
            // handle the error
            std::cout << "Error unzipping S3 file archive: " << key << std::endl;
            readyCallback(std::vector<uint8_t>());
        }

        // Access the file in the archive at fileIndex
        const auto fileIndex = zip_name_locate(archive, fileName.c_str(), 0);
        if (fileIndex < 0) {
            std::cout << "Error unzipping S3 file: " << key << std::endl;
            // handle error
            readyCallback(std::vector<uint8_t>());
        }
        zip_file* file = zip_fopen_index(archive, fileIndex, 0);
        if (!file) {
            std::cout << "Error unzipping S3 file: " << key << std::endl;
            // handle error
            readyCallback(std::vector<uint8_t>());
        }

        // Read the file into a buffer
        std::vector<uint8_t> fileContent;
        char fileBuffer[4096];
        int bytesRead;
        while ((bytesRead = zip_fread(file, fileBuffer, sizeof(fileBuffer))) > 0) {
            fileContent.insert(fileContent.end(), fileBuffer, fileBuffer + bytesRead);
        }

        zip_fclose(file);
        zip_close(archive);

        readyCallback(fileContent);
    } else {
        std::cout << "Error getting object from S3: " << get_object_outcome.GetError().GetMessage() << std::endl;
        readyCallback(std::vector<uint8_t>());
    }
}

// nlohmann::json AwsManager::GetJsonFromS3(const std::string& key, int fileIndex) {
//     std::vector<unsigned char> content = this->GetFileFromS3(key, fileIndex);
//     std::string contentString(content.begin(), content.end());
//     return nlohmann::json::parse(contentString);
// }

void AwsManager::GetAllObjectsInS3(std::function<void(std::vector<std::string>)> readyCallback) {
    Aws::S3::Model::ListObjectsV2Request objects_request;
    objects_request.WithBucket(bucketName.c_str());

    auto list_objects_outcome = s3Client->ListObjectsV2(objects_request);

    if (list_objects_outcome.IsSuccess()) {
        auto objects = list_objects_outcome.GetResult().GetContents();
        std::vector<std::string> Ret;
        for (const auto& object : objects) {
            Ret.push_back(object.GetKey());
        }
        readyCallback(Ret);
    } else {
        std::cerr << "Could not get objects from S3: " << list_objects_outcome.GetError().GetMessage() << std::endl;
        readyCallback(std::vector<std::string>());
    }
}

// //Note: Not 100% sure if this works, was having issues with nested jsons inside cells
// std::map<std::string, std::map<std::string, std::string>> AwsManager::GetCSVDataFromS3(const std::string& key, int fileIndex) {
//     std::vector<unsigned char> content = this->GetFileFromS3(key, fileIndex);

//     // Convert the vector of unsigned char to string
//     std::string contentString(content.begin(), content.end());

//     std::cout << contentString << std::endl;

//     // Create a stringstream from the string
//     std::istringstream contentStream(contentString);

//     // Read the CSV data directly from the stringstream
//     rapidcsv::Document doc(contentStream, rapidcsv::LabelParams(0, -1));

//     std::map<std::string, std::map<std::string, std::string>> itemMaps;

//     for (auto& rowLabel : doc.GetRowNames()) {
//         std::map<std::string, std::string> itemMap;

//         for (auto& colLabel : doc.GetColumnNames()) {
//             std::string columnValue = doc.GetCell<std::string>(std::string(colLabel), std::string(rowLabel));
//             itemMap[std::string(colLabel)] = columnValue;
//         }

//         itemMaps[std::string(rowLabel)] = itemMap;
//     }
//     return itemMaps;
// }