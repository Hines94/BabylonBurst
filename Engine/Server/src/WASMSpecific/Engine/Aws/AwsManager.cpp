#include "AwsManager.h"
#include "Engine/Utils/StringUtils.h"
#include "rapidcsv.h"
#include <fstream>
#include <iostream>
#include <vector>

AwsManager::AwsManager() {
}

void AwsManager::GetAllObjectsInS3(std::function<void(std::vector<std::string>)> readyCallback) {
    if (getAllObjectsCallback) {
        getAllObjectsCallback(readyCallback);
    } else {
        readyCallback(std::vector<std::string>());
    }
}

void AwsManager::GetFileFromS3(const std::string& key, int fileIndex, std::function<void(std::vector<uint8_t>)> readyCallback) {
    if (getFileCallback) {
        getFileCallback(StringUtils::EnsureZipExtension(key), fileIndex, readyCallback);
    } else {
        readyCallback(std::vector<uint8_t>());
    }
}

// nlohmann::json AwsManager::GetJsonFromS3(const std::string& key, int fileIndex) {
//     std::vector<unsigned char> content = this->GetFileFromS3(key, fileIndex);
//     std::string contentString(content.begin(), content.end());
//     //Nothing?
//     if (contentString == "") {
//         return nlohmann::json();
//     }
//     return nlohmann::json::parse(contentString);
// }

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