#include "WASMAwsInterface.h"
#include "Engine/Aws/AwsManager.h"
#include "WASMSetupInterface.h"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>
#include <vector>

using namespace emscripten;

std::map<std::string, std::function<void(std::vector<uint8_t>)>> awsDataReadyCallbacks;

void AwsGetItemDataCallback(std::vector<uint8_t> data, std::string url) {
    if (awsDataReadyCallbacks.find(url) == awsDataReadyCallbacks.end()) {
        std::cerr << "Callback for data asset " << url << " not found!" << std::endl;
        return;
    }
    awsDataReadyCallbacks[url](data);
    awsDataReadyCallbacks.erase(url);
}

void RequestAwsAsset(std::string url, int fileIndex, std::function<void(std::vector<uint8_t>)> readyCallback) {
    // This function is implemented client side
    awsDataReadyCallbacks.insert({url, readyCallback});
    emscripten::val::global("RequestAwsAsset")(url, fileIndex, WASMSetup::WASMModuleIdentifier);
}

std::function<void(std::vector<std::string>)> awsFindDataCallback;

void AwsGetAllDataCallback(std::vector<std::string> data) {
    awsFindDataCallback(data);
}

void RequestAllAwsAssets(std::function<void(std::vector<std::string>)> readyCallback) {
    awsFindDataCallback = readyCallback;
    emscripten::val::global("RequestAllAwsAssets")(WASMSetup::WASMModuleIdentifier);
}

void WASMAws::setupAwsWASMInterface() {
    AwsManager::getInstance().SetGetFileCallback(RequestAwsAsset);
    AwsManager::getInstance().SetGetAllObjectsCallback(RequestAllAwsAssets);
    std::cout << "Setup AWS Interface" << std::endl;
}

EMSCRIPTEN_BINDINGS(WASMAwsInterface) {
    function("AwsGetAllDataCallback", &AwsGetAllDataCallback);
    function("AwsGetItemDataCallback", &AwsGetItemDataCallback);
}
